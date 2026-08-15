using System.Security.Cryptography;
using System.Text;

namespace IdentityService.Services;

/// <summary>
/// Application-level encryption at rest for sensitive fields (KYC selfie/ID
/// images). Uses AES-256-GCM with a 32-byte key supplied via configuration
/// (<c>Encryption:Key</c>, base64). Ciphertext is tagged "enc:v1:" so decryption
/// can tell it apart from legacy plaintext values and pass those through
/// unchanged — so turning encryption on doesn't break existing records.
/// If no key is configured, values are stored as-is (encryption is a no-op).
/// </summary>
public class DataEncryptor
{
    private const string Prefix = "enc:v1:";
    private readonly byte[] _key;
    private readonly ILogger<DataEncryptor> _logger;

    public DataEncryptor(IConfiguration config, ILogger<DataEncryptor> logger)
    {
        _logger = logger;
        var b64 = config["Encryption:Key"];
        if (!string.IsNullOrWhiteSpace(b64))
        {
            try
            {
                var k = Convert.FromBase64String(b64.Trim());
                if (k.Length == 32) _key = k;
                else logger.LogError("Encryption:Key must be 32 bytes (base64); got {Len}. Encryption disabled.", k.Length);
            }
            catch
            {
                logger.LogError("Encryption:Key is not valid base64. Encryption disabled.");
            }
        }
        else
        {
            logger.LogWarning("Encryption:Key not set — sensitive fields will be stored unencrypted.");
        }
    }

    public bool Enabled => _key != null;

    /// <summary>Encrypt a value for storage. Returns it unchanged if no key is set.</summary>
    public string Encrypt(string plaintext)
    {
        if (_key == null || string.IsNullOrEmpty(plaintext) || plaintext.StartsWith(Prefix))
            return plaintext;

        var pt = Encoding.UTF8.GetBytes(plaintext);
        var nonce = RandomNumberGenerator.GetBytes(AesGcm.NonceByteSizes.MaxSize);
        var cipher = new byte[pt.Length];
        var tag = new byte[AesGcm.TagByteSizes.MaxSize];

        using var aes = new AesGcm(_key, tag.Length);
        aes.Encrypt(nonce, pt, cipher, tag);

        var blob = new byte[nonce.Length + cipher.Length + tag.Length];
        Buffer.BlockCopy(nonce, 0, blob, 0, nonce.Length);
        Buffer.BlockCopy(cipher, 0, blob, nonce.Length, cipher.Length);
        Buffer.BlockCopy(tag, 0, blob, nonce.Length + cipher.Length, tag.Length);
        return Prefix + Convert.ToBase64String(blob);
    }

    /// <summary>Decrypt a stored value. Legacy plaintext (no prefix) is returned as-is.</summary>
    public string Decrypt(string stored)
    {
        if (string.IsNullOrEmpty(stored) || !stored.StartsWith(Prefix)) return stored;
        if (_key == null)
        {
            _logger.LogError("Encrypted value present but Encryption:Key is not configured.");
            return stored;
        }

        try
        {
            var blob = Convert.FromBase64String(stored[Prefix.Length..]);
            var nonceLen = AesGcm.NonceByteSizes.MaxSize;
            var tagLen = AesGcm.TagByteSizes.MaxSize;
            var nonce = blob[..nonceLen];
            var tag = blob[^tagLen..];
            var cipher = blob[nonceLen..^tagLen];
            var pt = new byte[cipher.Length];

            using var aes = new AesGcm(_key, tagLen);
            aes.Decrypt(nonce, cipher, tag, pt);
            return Encoding.UTF8.GetString(pt);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt a stored value.");
            return stored;
        }
    }
}
