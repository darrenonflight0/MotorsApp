using System.Security.Cryptography;
using System.Text;

namespace BiddingService.Services.Payments;

/// <summary>
/// Verifies Paystack webhook signatures. Paystack signs the raw request body
/// with HMAC-SHA512 keyed on the account's secret key and sends the lowercase
/// hex digest in the <c>x-paystack-signature</c> header.
/// </summary>
public static class PaystackSignature
{
    public static string Compute(string body, string secretKey)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secretKey));
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(body ?? ""))).ToLowerInvariant();
    }

    public static bool Verify(string body, string signature, string secretKey)
    {
        if (string.IsNullOrEmpty(signature) || string.IsNullOrEmpty(secretKey)) return false;
        var computed = Compute(body, secretKey);
        // Constant-time comparison to avoid leaking the digest via timing.
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computed), Encoding.UTF8.GetBytes(signature));
    }
}
