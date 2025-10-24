
using Fivvy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Fivvy.Api.Utils;
using Fivvy.Api.Repositories;
using Fivvy.Api.Repositories.Invoice;
using Fivvy.Api.Models;
using Fivvy.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/invoice")]
public class InvoicePdfController : ControllerBase
{
    private readonly PDFService _pdfService;
    private readonly IClientPortalTokenRepository _clientPortalTokens;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly AppDbContext _db;

    public InvoicePdfController(PDFService pdfService, IClientPortalTokenRepository clientPortalTokens, IInvoiceRepository invoiceRepository, AppDbContext db)
    {
        _pdfService = pdfService;
        _clientPortalTokens = clientPortalTokens;
        _invoiceRepository = invoiceRepository;
        _db = db;
    }

    [HttpGet("{invoiceId}/pdf")]
    [AllowAnonymous]
    public async Task<IActionResult> DownloadPdf(int invoiceId, [FromQuery] int? clientId, [FromQuery] string? portalToken)
    {
        // First try standard Authorization header
        if (AuthHeaderHelper.TryGetBearerToken(HttpContext, out var bearerToken))
        {
            var bytes = await _pdfService.DownloadInvoiceAsPDFAsync(bearerToken, invoiceId);
            var fileName = $"invoice-{invoiceId}.pdf";
            return File(bytes, "application/pdf", fileName);
        }

        // If no bearer token, allow client-portal access when clientId and portal token are provided
        if (clientId.HasValue && !string.IsNullOrWhiteSpace(portalToken))
        {
            var t = await _clientPortalTokens.ValidateTokenAsync(clientId.Value, portalToken, markUsed: false);
            if (t == null) return Unauthorized("Invalid portal token");

            // ensure invoice belongs to that client - use DB directly (no auth)
            var invoice = await _db.Invoices
                .Include(i => i.LineItems)
                .Include(i => i.Client)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null || invoice.ClientId != clientId.Value)
            {
                return Forbid();
            }

            // Generate pdf using invoice data and no company header
            var bytes = await _pdfService.GeneratePdfFromInvoiceAsync(invoice, null, null, null);
            var fileName = $"invoice-{invoiceId}.pdf";
            return File(bytes, "application/pdf", fileName);
        }

        return Unauthorized("Token not found");
    }
}