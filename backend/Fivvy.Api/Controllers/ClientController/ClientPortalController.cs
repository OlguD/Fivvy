using Fivvy.Api.Data;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/client")]
public class ClientPortalController : ControllerBase
{
    private readonly IClientPortalTokenRepository _clientPortalRepository;
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public ClientPortalController(IClientPortalTokenRepository clientPortalRepository, AppDbContext context, IConfiguration configuration)
    {
        _clientPortalRepository = clientPortalRepository;
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("{clientId}/portal/token")]
    [Authorize]
    public async Task<IActionResult> CreatePortalToken(int clientId)
    {
        var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == clientId);
        if (client == null)
        {
            return NotFound();
        }

        // Get current user id from claims
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrWhiteSpace(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        // Allow if user is admin or owns the client
        var isAdmin = User.IsInRole("admin");
        var ownsClient = client.UserId == userId;

        if (!isAdmin && !ownsClient)
        {
            return Forbid();
        }

        var token = await _clientPortalRepository.CreateTokenAsync(clientId, TimeSpan.FromMinutes(30));
        // Use configured frontend base URL when available. Fall back to request host.
        var frontendBase = _configuration["FrontendBaseUrl"];
        if (string.IsNullOrWhiteSpace(frontendBase))
        {
            frontendBase = $"{Request.Scheme}://{Request.Host}";
        }
        var link = $"{frontendBase.TrimEnd('/')}/client/{clientId}/portal?token={token}";
        return Ok(new { token, link, expiresInMinutes = 30 });
    }

    [HttpGet("{clientId}/portal")]
    public async Task<IActionResult> GetPortalData(int clientId, [FromQuery] string token)
    {
        var data = await _clientPortalRepository.GetPortalDataAsync(clientId, token);
        if (data == null) return Unauthorized();
        return Ok(data);
    }


    [HttpPost("{clientId}/portal/invoices/{invoiceId}/approve")]
    public async Task<IActionResult> ApproveInvoice(int clientId, int invoiceId, [FromQuery] string token)
    {
        var ok = await _clientPortalRepository.ApproveInvoiceAsync(clientId, invoiceId, token);
        if (!ok) return Unauthorized();
        return Ok(new { success = true, invoiceId });
    }
}