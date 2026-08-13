using BiddingService.Models;
using BiddingService.Services.Payments;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Entities;

namespace BiddingService.Controllers;

/// <summary>
/// Seller payout onboarding. A seller registers the bank account their escrow
/// proceeds are released to; we store only the provider's recipient handle and a
/// masked display, never the raw account number. This is what lets the escrow
/// release path actually pay a seller when real funds are in play.
/// </summary>
[ApiController]
[Route("api/payouts")]
[Authorize]
public class PayoutController : ControllerBase
{
    private readonly ILogger<PayoutController> _logger;
    private readonly IEscrowPaymentProvider _payments;

    public PayoutController(ILogger<PayoutController> logger, IEscrowPaymentProvider payments)
    {
        _logger = logger;
        _payments = payments;
    }

    private string Username => User.Identity!.Name;

    private static object ToDto(PayoutMethod m) => m == null ? null : new
    {
        provider = m.Provider,
        bankName = m.BankName,
        accountName = m.AccountName,
        accountLast4 = m.AccountLast4,
        currency = m.Currency,
        updatedAt = m.UpdatedAt,
    };

    /// <summary>The caller's current payout destination, or null if none set.</summary>
    [HttpGet("mine")]
    public async Task<ActionResult> Mine()
    {
        var method = await DB.Find<PayoutMethod>().Match(m => m.Seller == Username).ExecuteFirstAsync();
        return Ok(new { provider = _payments.Name, method = ToDto(method) });
    }

    /// <summary>Banks the seller can pay out to for the given currency.</summary>
    [HttpGet("banks")]
    public async Task<ActionResult> Banks([FromQuery] string currency = null)
    {
        var banks = await _payments.ListPayoutBanksAsync(currency);
        return Ok(banks);
    }

    public record RegisterPayoutDto(string BankCode, string AccountNumber, string AccountName, string Currency);

    /// <summary>Register (or replace) the caller's payout destination.</summary>
    [HttpPost("recipient")]
    public async Task<ActionResult> Register([FromBody] RegisterPayoutDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.BankCode) || string.IsNullOrWhiteSpace(dto.AccountNumber))
            return BadRequest("Bank and account number are required.");

        var result = await _payments.CreatePayoutRecipientAsync(
            new PayoutRecipientRequest(dto.BankCode.Trim(), dto.AccountNumber.Trim(), dto.AccountName?.Trim(), dto.Currency));
        if (!result.Success)
        {
            _logger.LogWarning("PAYOUT recipient_failed user={User} reason={Reason}", Username, result.Message);
            return StatusCode(StatusCodes.Status400BadRequest, new { error = result.Message });
        }

        var method = await DB.Find<PayoutMethod>().Match(m => m.Seller == Username).ExecuteFirstAsync()
            ?? new PayoutMethod { Seller = Username };
        method.Provider = _payments.Name;
        method.RecipientCode = result.RecipientCode;
        method.BankName = result.BankName ?? dto.AccountName;
        method.AccountName = dto.AccountName;
        method.AccountLast4 = result.AccountLast4;
        method.Currency = dto.Currency;
        method.UpdatedAt = DateTime.UtcNow;
        await DB.SaveAsync(method);

        _logger.LogInformation("PAYOUT recipient_registered user={User} provider={Provider}", Username, _payments.Name);
        return Ok(ToDto(method));
    }
}
