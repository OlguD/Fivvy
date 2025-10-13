
using Fivvy.Api.Models;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;


[ApiController]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAuthRepository _authRepository;

    public AdminController(IAuthRepository authRepository)
    {
        _authRepository = authRepository;
    }

    [HttpGet("get-user-stats")]
    [Authorize]
    public async Task<IActionResult> GetUsers([FromHeader(Name = "Token")] string? token)
    {
        try
        {
            var effectiveToken = !string.IsNullOrWhiteSpace(token)
                ? token
                : ExtractTokenFromAuthorization();

            if (string.IsNullOrWhiteSpace(effectiveToken))
            {
                return BadRequest("Token can not be empty");
            }

            var adminDashboardStats = await _authRepository.AdminStatsAsync(effectiveToken);
            return Ok(adminDashboardStats);

        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private string? ExtractTokenFromAuthorization()
    {
        if (!Request.Headers.TryGetValue("Authorization", out var headerValues))
        {
            return null;
        }

        var header = headerValues.ToString();
        if (string.IsNullOrWhiteSpace(header))
        {
            return null;
        }

        const string bearerPrefix = "Bearer ";
        if (header.StartsWith(bearerPrefix, StringComparison.OrdinalIgnoreCase))
        {
            return header[bearerPrefix.Length..].Trim();
        }

        return header.Trim();
    }
}