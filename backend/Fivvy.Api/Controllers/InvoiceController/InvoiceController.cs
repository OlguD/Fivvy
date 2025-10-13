
using Fivvy.Api.Models;
using Fivvy.Api.Repositories.Invoice;
using Fivvy.Api.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;


[ApiController]
[Route("api/invoice")]
public class InvoiceController : ControllerBase
{
    private readonly IInvoiceRepository _invoiceRepository;

    public InvoiceController(IInvoiceRepository invoiceRepository)
    {
        _invoiceRepository = invoiceRepository;
    }


    [HttpGet("get-all-invoices")]
    [Authorize]
    public async Task<IActionResult> GetAllInvoices()
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        var invoices = await _invoiceRepository.GetAllInvoiceAsync(token);
        return Ok(invoices);
    }

    [HttpGet("get-invoice")]
    [Authorize]
    public async Task<IActionResult> GetInvoice([FromQuery] int invoiceId)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        try
        {
            var invoice = await _invoiceRepository.GetInvoiceAsync(token, invoiceId);
            return Ok(invoice);
        } catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("create-invoice")]
    [Authorize]
    public async Task<IActionResult> CreateInvoice([FromBody] InvoiceModel model)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        var created = await _invoiceRepository.CreateInvoiceAsync(token, model);

        if (!created)
        {
            return Forbid();
        }

        return CreatedAtAction(nameof(GetInvoice), new { invoiceId = model.Id }, model);
    }

    [HttpPut("update-invoice")]
    [Authorize]
    public async Task<IActionResult> UpdateInvoice([FromBody] InvoiceModel model)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        var updated = await _invoiceRepository.UpdateInvoiceAsync(token, model);
        if (!updated)
        {
            return Forbid();
        }

        return Ok(model);
    }


    [HttpDelete("delete-invoice")]
    [Authorize]
    public async Task<IActionResult> DeleteInvoice([FromQuery] int invoiceId)
    {
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        var deleted = await _invoiceRepository.DeleteInvoiceAsync(token, invoiceId);

        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}