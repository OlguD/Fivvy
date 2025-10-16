
using Fivvy.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Fivvy.Api.Utils;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/invoice")]
public class InvoicePdfController : ControllerBase
{
    private readonly PDFService _pdfService;

    public InvoicePdfController(PDFService pdfService)
    {
        _pdfService = pdfService;
    }

    [HttpGet("{invoiceId}/pdf")]
    [Authorize]
    public async Task<IActionResult> DownloadPdf(int invoiceId)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }
        var bytes = await _pdfService.DownloadInvoiceAsPDFAsync(token, invoiceId);
        var fileName = $"invoice-{invoiceId}.pdf";
        return File(bytes, "application/pdf", fileName);
    }
}