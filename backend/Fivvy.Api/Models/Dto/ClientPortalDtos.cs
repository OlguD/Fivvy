using System;
using System.Collections.Generic;

namespace Fivvy.Api.Models.Dto
{
    // Minimal shapes for sending to client portal frontend
    public record PortalClientDto(int Id, string? ContactName, string? Email, string? CompanyName);
    public record PortalProjectDto(int Id, string ProjectName, bool IsActive, double ProjectPrice);
    public record PortalInvoiceDto(int Id, string? InvoiceNumber, InvoiceStatus Status, decimal Total, DateTime DueDate, DateTime InvoiceDate);
    public record PortalDataDto(PortalClientDto Client, List<PortalProjectDto> Projects, List<PortalInvoiceDto> Invoices);
}