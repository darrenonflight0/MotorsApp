using System.Net.Http.Headers;
using BiddingService.Models;

namespace BiddingService.Services.Payments;

/// <summary>
/// Real payment provider backed by the Stripe REST API (called directly over
/// HTTPS, so no SDK dependency is required). Activated only when
/// Payments:Provider=Stripe and Payments:Stripe:SecretKey are configured.
///
/// Model: the buyer's card is charged via a manual-capture PaymentIntent created
/// on the client; this service captures it into platform custody on deposit,
/// then either refunds the buyer or transfers to the seller's connected account
/// (Stripe Connect) on resolution. The secret key is supplied via configuration
/// / secret store and never lives in source.
/// </summary>
public class StripeEscrowPaymentProvider : IEscrowPaymentProvider
{
    private readonly HttpClient _http;
    private readonly ILogger<StripeEscrowPaymentProvider> _logger;
    private readonly string _currency;

    public StripeEscrowPaymentProvider(HttpClient http, IConfiguration config, ILogger<StripeEscrowPaymentProvider> logger)
    {
        _logger = logger;
        var secretKey = config["Payments:Stripe:SecretKey"]
            ?? throw new InvalidOperationException("Payments:Stripe:SecretKey is required to use the Stripe provider.");
        _currency = config["Payments:Stripe:Currency"] ?? "usd";

        _http = http;
        _http.BaseAddress ??= new Uri("https://api.stripe.com/");
        _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", secretKey);
    }

    public string Name => "Stripe";
    public bool HandlesRealFunds => true;

    // Stripe works in the currency's minor unit (cents). Escrow.Amount is whole units.
    private long MinorUnits(int amount) => amount * 100L;

    public async Task<PaymentResult> CaptureDepositAsync(Escrow escrow, string paymentReference, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return PaymentResult.Fail("A Stripe PaymentIntent id is required to capture the deposit.");

        // Capture the manual-capture PaymentIntent the buyer confirmed client-side.
        var resp = await _http.PostAsync(
            $"v1/payment_intents/{paymentReference}/capture",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["amount_to_capture"] = MinorUnits(escrow.Amount).ToString(),
            }), ct);

        return await ToResult(resp, paymentReference, "deposit captured", ct);
    }

    public async Task<PaymentResult> RefundBuyerAsync(Escrow escrow, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(escrow.DepositReference))
            return PaymentResult.Fail("No captured deposit to refund.");

        var resp = await _http.PostAsync("v1/refunds",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["payment_intent"] = escrow.DepositReference,
            }), ct);

        return await ToResult(resp, null, "buyer refunded", ct);
    }

    public async Task<PaymentResult> ReleaseToSellerAsync(Escrow escrow, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(escrow.SellerPayoutAccount))
            return PaymentResult.Fail(
                "The seller hasn't set up a payout account yet, so funds can't be released. " +
                "The seller must complete payout onboarding first.");

        // Transfer held funds to the seller's connected account.
        var resp = await _http.PostAsync("v1/transfers",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["amount"] = MinorUnits(escrow.Amount).ToString(),
                ["currency"] = _currency,
                ["destination"] = escrow.SellerPayoutAccount,
                ["transfer_group"] = escrow.AuctionId,
            }), ct);

        return await ToResult(resp, null, "released to seller", ct);
    }

    public async Task<PaymentResult> VerifyPaymentAsync(int amount, string paymentReference, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return PaymentResult.Fail("A Stripe PaymentIntent id is required.");

        var resp = await _http.PostAsync(
            $"v1/payment_intents/{paymentReference}/capture",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["amount_to_capture"] = MinorUnits(amount).ToString(),
            }), ct);

        return await ToResult(resp, paymentReference, "payment verified", ct);
    }

    public async Task<PaymentResult> RefundPaymentAsync(string paymentReference, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(paymentReference))
            return PaymentResult.Fail("No payment reference to refund.");

        var resp = await _http.PostAsync("v1/refunds",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["payment_intent"] = paymentReference,
            }), ct);

        return await ToResult(resp, null, "payment refunded", ct);
    }

    // Stripe pays sellers through Stripe Connect onboarding (a hosted flow that
    // yields a connected-account id), not a bank-account recipient list. The
    // bank-form onboarding used by Paystack does not apply here.
    public Task<IReadOnlyList<PayoutBank>> ListPayoutBanksAsync(string currency, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<PayoutBank>>(Array.Empty<PayoutBank>());

    public Task<RecipientResult> CreatePayoutRecipientAsync(PayoutRecipientRequest request, CancellationToken ct = default) =>
        Task.FromResult(RecipientResult.Fail(
            "Stripe payouts use Stripe Connect onboarding; a bank account cannot be registered directly here."));

    private async Task<PaymentResult> ToResult(HttpResponseMessage resp, string fallbackRef, string okMessage, CancellationToken ct)
    {
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogError("PAYMENT stripe_error status={Status} body={Body}", (int)resp.StatusCode, body);
            return PaymentResult.Fail($"Stripe error ({(int)resp.StatusCode}).");
        }

        // Pull the object id from the JSON without taking a serializer dependency.
        var id = fallbackRef;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("id", out var idEl)) id = idEl.GetString();
        }
        catch { /* keep fallback reference */ }

        return PaymentResult.Ok(id, okMessage);
    }
}
