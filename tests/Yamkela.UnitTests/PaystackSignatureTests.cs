using BiddingService.Services.Payments;
using Xunit;

namespace Yamkela.UnitTests;

public class PaystackSignatureTests
{
    private const string Secret = "sk_test_example_secret";
    private const string Body = "{\"event\":\"charge.success\",\"data\":{\"reference\":\"ref_123\"}}";

    [Fact]
    public void Verify_AcceptsAGenuineSignature()
    {
        var signature = PaystackSignature.Compute(Body, Secret);
        Assert.True(PaystackSignature.Verify(Body, signature, Secret));
    }

    [Fact]
    public void Verify_RejectsTamperedBody()
    {
        var signature = PaystackSignature.Compute(Body, Secret);
        var tampered = Body.Replace("ref_123", "ref_999");
        Assert.False(PaystackSignature.Verify(tampered, signature, Secret));
    }

    [Fact]
    public void Verify_RejectsWrongSecret()
    {
        var signature = PaystackSignature.Compute(Body, Secret);
        Assert.False(PaystackSignature.Verify(Body, signature, "sk_test_other_secret"));
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    [InlineData("deadbeef")]
    public void Verify_RejectsMissingOrBogusSignature(string signature)
    {
        Assert.False(PaystackSignature.Verify(Body, signature, Secret));
    }
}
