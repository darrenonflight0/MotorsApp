using System.Text.Json;
using System.Net.Http.Headers;
using BiddingService.Models;
using BiddingService.Services;

namespace BiddingService.Services.Payments;

/// <summary>
/// Real payment provider backed by the Paystack REST API (called directly over
/// HTTPS, so no SDK dependency is required). Activated only when
/// Payments:Provider=Paystack and Payments:Paystack:SecretKey are configured.
///
/// Flow: the buyer pays through a Paystack checkout the frontend initialises;
/// this service then <b>verifies</b> that transaction to move the escrow to
/// Funded, and later <b>refunds</b> the buyer or <b>transfers</b> the held funds
/// to the seller's Paystack transfer recipient on resolution. The secret key is
/// supplied via configuration / secret store and never lives in source.
/// </summary>
public class PaystackEscrowPaymentProvider : IEscrowPaymentProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<PaystackEscrowPaymentProvider> _logger;
    private readonly string _currency;
    private readonly string _recipientType;
    private readonly int _buyerPremiumPercent;

    // Paystack's transfer-recipient "type" is country/currency specific. Default
    // by settlement currency; override with Payments:Paystack:RecipientType.
    private static readonly Dictionary<string, string> RecipientTypeByCurrency = new(StringComparer.OrdinalIgnoreCase)
    {
        ["NGN"] = "nuban",
        ["GHS"] = "ghipss",
        ["ZAR"] = "basa",
        ["KES"] = "mobile_money",
    };

    public PaystackEscrowPaymentProvider(HttpClient http, IConfiguration config, ILogger<PaystackEscrowPaymentProvider> logger)
    {
        _logger = logger;
        var secretKey = config["Payments:Paystack:SecretKey"]
            ?? throw new InvalidOperationException("Payments:Paystack:SecretKey is required to use the Paystack provider.");
        _currency = config["Payments:Paystack:Currency"] ?? "NGN";
        _recipientType = config["Payments:Paystack:RecipientType"]
            ?? (RecipientTypeByCurrency.TryGetValue(_currency, out var t) ? t : "nuban");
        _buyerPremiumPercent = PlatformFees.BuyerPremiumPercent(config);

        _http = http;
        _http.BaseAddress ??= new Uri("https://api.paystack.co/");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);
    }

    public string Name => "Paystack";
    public bool HandlesRealFunds => true;

    // Paystack works in the currency's minor unit (kobo / pesewas / cents).
    private long MinorUnits(int amount) => amount * 100L;

    /// <summary>
    /// Confirms the buyer's checkout succeeded. <paramref name="paymentReference"/>
    /// is the Paystack transaction reference returned from the checkout.
    /// </summary>
    public async Task<PaymentResult> CaptureDepositAsync(Escrow escrow, string paymentReference, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return PaymentResult.Fail("A Paystack transaction reference is required to confirm the deposit.");

        var resp = await _http.GetAsync($"transaction/verify/{Uri.EscapeDataString(paymentReference)}", ct);
        var (ok, data, message) = await ReadEnvelope(resp, ct);
        if (!ok) return PaymentResult.Fail(message);

        // The transaction itself must be successful and cover the full amount.
        var txStatus = data.TryGetProperty("status", out var s) ? s.GetString() : null;
        var paid = data.TryGetProperty("amount", out var a) && a.TryGetInt64(out var amt) ? amt : 0;
        if (txStatus != "success")
            return PaymentResult.Fail($"Paystack transaction not successful (status={txStatus}).");

        // Buyer must have paid the winning bid plus the buyer's premium.
        var due = PlatformFees.Total(escrow.Amount, _buyerPremiumPercent);
        if (paid < MinorUnits(due))
            return PaymentResult.Fail("Paystack transaction amount is less than the amount due (bid + buyer's premium).");

        return PaymentResult.Ok(paymentReference, "deposit verified");
    }

    public async Task<PaymentResult> RefundBuyerAsync(Escrow escrow, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(escrow.DepositReference))
            return PaymentResult.Fail("No captured deposit to refund.");

        var resp = await _http.PostAsync("refund",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["transaction"] = escrow.DepositReference,
            }), ct);

        var (ok, data, message) = await ReadEnvelope(resp, ct);
        return ok ? PaymentResult.Ok(RefOrNull(data), "buyer refunded") : PaymentResult.Fail(message);
    }

    public async Task<PaymentResult> ReleaseToSellerAsync(Escrow escrow, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(escrow.SellerPayoutAccount))
            return PaymentResult.Fail(
                "The seller hasn't set up a payout account yet, so funds can't be released. " +
                "The seller can add one under Payout settings on their profile.");

        // Transfer held funds from the platform balance to the seller's recipient.
        var resp = await _http.PostAsync("transfer",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["source"] = "balance",
                ["amount"] = MinorUnits(escrow.Amount).ToString(),
                ["currency"] = _currency,
                ["recipient"] = escrow.SellerPayoutAccount,
                ["reason"] = $"Yamkela auction {escrow.AuctionId} settlement",
            }), ct);

        var (ok, data, message) = await ReadEnvelope(resp, ct);
        return ok ? PaymentResult.Ok(RefOrNull(data), "released to seller") : PaymentResult.Fail(message);
    }

    public async Task<IReadOnlyList<PayoutBank>> ListPayoutBanksAsync(string currency, CancellationToken ct = default)
    {
        var cur = string.IsNullOrWhiteSpace(currency) ? _currency : currency;
        var resp = await _http.GetAsync($"bank?currency={Uri.EscapeDataString(cur)}&perPage=100", ct);
        var (ok, data, _) = await ReadEnvelope(resp, ct);
        if (!ok || data.ValueKind != JsonValueKind.Array) return Array.Empty<PayoutBank>();

        var banks = new List<PayoutBank>();
        foreach (var b in data.EnumerateArray())
        {
            var name = b.TryGetProperty("name", out var n) ? n.GetString() : null;
            var code = b.TryGetProperty("code", out var c) ? c.GetString() : null;
            if (!string.IsNullOrWhiteSpace(name) && !string.IsNullOrWhiteSpace(code))
                banks.Add(new PayoutBank(name, code));
        }
        return banks;
    }

    public async Task<RecipientResult> CreatePayoutRecipientAsync(PayoutRecipientRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.BankCode) || string.IsNullOrWhiteSpace(request.AccountNumber))
            return RecipientResult.Fail("Bank and account number are required.");

        var currency = string.IsNullOrWhiteSpace(request.Currency) ? _currency : request.Currency;
        var resp = await _http.PostAsync("transferrecipient",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["type"] = _recipientType,
                ["name"] = request.AccountName ?? request.AccountNumber,
                ["account_number"] = request.AccountNumber,
                ["bank_code"] = request.BankCode,
                ["currency"] = currency,
            }), ct);

        var (ok, data, message) = await ReadEnvelope(resp, ct);
        if (!ok) return RecipientResult.Fail(message);

        var code = data.TryGetProperty("recipient_code", out var rc) ? rc.GetString() : null;
        if (string.IsNullOrWhiteSpace(code))
            return RecipientResult.Fail("Paystack did not return a recipient code.");

        // Prefer Paystack's resolved account details for an accurate display.
        string bankName = null, last4 = null;
        if (data.TryGetProperty("details", out var det) && det.ValueKind == JsonValueKind.Object)
        {
            bankName = det.TryGetProperty("bank_name", out var bn) ? bn.GetString() : null;
            var acct = det.TryGetProperty("account_number", out var an) ? an.GetString() : request.AccountNumber;
            last4 = acct is { Length: >= 4 } ? acct[^4..] : acct;
        }
        last4 ??= request.AccountNumber is { Length: >= 4 } ? request.AccountNumber[^4..] : request.AccountNumber;

        return RecipientResult.Ok(code, bankName, last4);
    }

    // Paystack wraps every response in { status: bool, message: string, data: {...} }.
    private async Task<(bool ok, JsonElement data, string message)> ReadEnvelope(HttpResponseMessage resp, CancellationToken ct)
    {
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("PAYMENT paystack_error status={Status} body={Body}", (int)resp.StatusCode, body);
            return (false, default, $"Paystack error ({(int)resp.StatusCode}).");
        }

        try
        {
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement.Clone();
            var apiOk = root.TryGetProperty("status", out var st) && st.ValueKind == JsonValueKind.True;
            var msg = root.TryGetProperty("message", out var m) ? m.GetString() : "";
            var data = root.TryGetProperty("data", out var d) ? d.Clone() : default;
            return apiOk ? (true, data, msg) : (false, default, msg ?? "Paystack request rejected.");
        }
        catch
        {
            return (false, default, "Unreadable Paystack response.");
        }
    }

    private static string RefOrNull(JsonElement data) =>
        data.ValueKind == JsonValueKind.Object && data.TryGetProperty("reference", out var r)
            ? r.GetString()
            : (data.ValueKind == JsonValueKind.Object && data.TryGetProperty("id", out var id) ? id.ToString() : null);
}
