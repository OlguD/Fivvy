

using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Fivvy.Api.Repositories.Invoice;
using Fivvy.Api.Models;
namespace Fivvy.Api.Services;


public class PDFService
{
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IUserRepository _userRepository;

    public PDFService(IInvoiceRepository invoiceRepository, IUserRepository userRepository)
    {
        _invoiceRepository = invoiceRepository;
        _userRepository = userRepository;
    }

    public async Task<byte[]> DownloadInvoiceAsPDFAsync(string token, int invoiceId)
    {
        var invoice = await _invoiceRepository.GetInvoiceByIdAsync(token, invoiceId);
        if (invoice == null)
        {
            throw new KeyNotFoundException("Invoice not found");
        }
    // Path to logo (absolute path provided by user)
        var logoPath = "/Users/olgudegirmenci/Desktop/Fivvy/frontend/src/assets/logo1.png";

    // Load current user's company details from DB using the provided token
    var currentUser = await _userRepository.Profile(token);
    var companyName = string.IsNullOrWhiteSpace(currentUser.CompanyName) ? null : currentUser.CompanyName;
    var companyAddress = string.IsNullOrWhiteSpace(currentUser.Address) ? null : currentUser.Address;
    var companyCity = string.IsNullOrWhiteSpace(currentUser.City) ? null : currentUser.City;
    var hasCompanyInfo = !string.IsNullOrWhiteSpace(companyName) || !string.IsNullOrWhiteSpace(companyAddress) || !string.IsNullOrWhiteSpace(companyCity);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(11).FontColor(Colors.Grey.Darken3));
                page.Header().PaddingBottom(10).Row(row =>
                {
                    // Left: logo + company name
                    // Larger logo area (simplified to avoid nested rows which can create conflicting constraints)
                    row.ConstantItem(180).Column(c =>
                    {
                        if (File.Exists(logoPath))
                        {
                            // Use fixed width only and allow height to scale to preserve aspect ratio
                            c.Item().Width(160).AlignCenter().ScaleToFit().Image(logoPath);
                        }
                        else
                        {
                            c.Item().Width(160).AlignCenter().Placeholder();
                        }
                    });

                    // Middle: invoice title and dates
                    row.RelativeItem().Column(c =>
                    {
                        // Slightly smaller invoice title as requested
                        c.Item().Text($"Invoice #{invoice.InvoiceNumber ?? invoice.Id.ToString()}").FontSize(14).Bold().FontColor(Colors.Black);
                        c.Item().Text($"Issued: {invoice.InvoiceDate:yyyy-MM-dd}").FontSize(10).FontColor(Colors.Grey.Darken1);
                        c.Item().Text($"Due: {invoice.DueDate:yyyy-MM-dd}").FontSize(10).FontColor(Colors.Grey.Darken1);
                    });

                    // Right: company address / invoice meta (render only if user has at least one company field)
                    if (hasCompanyInfo)
                    {
                        row.ConstantItem(180).AlignRight().Column(c =>
                        {
                            if (!string.IsNullOrWhiteSpace(companyName)) c.Item().Text(companyName).Bold().FontSize(12);
                            if (!string.IsNullOrWhiteSpace(companyAddress)) c.Item().Text(companyAddress);
                            if (!string.IsNullOrWhiteSpace(companyCity)) c.Item().Text(companyCity);
                            // c.Item().Text($"Invoice ID: {invoice.Id}").FontSize(10).FontColor(Colors.Grey.Lighten1);
                        });
                    }
                });

                page.Content().Column(col =>
                {
                    col.Item().PaddingVertical(6).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                    // Bill to / Client
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Bill To").SemiBold();
                            c.Item().Text(invoice.Client?.CompanyName ?? "-").Bold();
                            if (!string.IsNullOrWhiteSpace(invoice.Client?.Address))
                                c.Item().Text(invoice.Client.Address);
                            if (!string.IsNullOrWhiteSpace(invoice.Client?.Email))
                                c.Item().Text(invoice.Client.Email).FontColor(Colors.Grey.Lighten1).FontSize(10);
                        });

                        row.ConstantItem(200).Column(c =>
                        {
                            c.Item().AlignRight().Text($"Amount Due").FontSize(10).FontColor(Colors.Grey.Darken1);
                            c.Item().AlignRight().Text($"{invoice.Total:C}").FontSize(20).Bold().FontColor(Colors.Black);
                        });
                    });

                    col.Item().PaddingVertical(12).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(6);
                            columns.ConstantColumn(60);
                            columns.ConstantColumn(90);
                            columns.ConstantColumn(90);
                        });

                        // Header styling
                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(8).Text("Description").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(8).AlignRight().Text("Qty").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(8).AlignRight().Text("Unit").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(8).AlignRight().Text("Total").SemiBold();
                        });

                        // Rows with zebra shading
                        var lines = invoice.LineItems ?? Enumerable.Empty<InvoiceLineItemModel>();
                        var rowIndex = 0;
                        foreach (var line in lines)
                        {
                            var isEven = (rowIndex++ % 2) == 0;
                            table.Cell().Background(isEven ? Colors.White : Colors.Grey.Lighten5).Padding(8).Text(line.Description ?? "");
                            table.Cell().Background(isEven ? Colors.White : Colors.Grey.Lighten5).Padding(8).AlignRight().Text($"{line.Quantity}");
                            table.Cell().Background(isEven ? Colors.White : Colors.Grey.Lighten5).Padding(8).AlignRight().Text($"{line.UnitPrice:C}");
                            table.Cell().Background(isEven ? Colors.White : Colors.Grey.Lighten5).Padding(8).AlignRight().Text($"{line.Total:C}");
                        }
                    });

                    // Totals box
                    col.Item().PaddingTop(12).Column(c =>
                    {
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Column(cc => { cc.Item().Text(string.Empty); });
                            r.ConstantItem(260).Column(cc =>
                            {
                                cc.Item().Table(t =>
                                {
                                    t.ColumnsDefinition(cd => { cd.RelativeColumn(); cd.ConstantColumn(120); });
                                    t.Cell().Element(e => e.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).Text("Subtotal");
                                    t.Cell().Element(e => e.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).AlignRight().Text($"{invoice.SubTotal:C}");

                                    t.Cell().Element(e => e.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).Text($"Tax");
                                    t.Cell().Element(e => e.Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).AlignRight().Text($"{invoice.Tax:C}");

                                    t.Cell().Element(e => e.BorderTop(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).Text("Total").Bold();
                                    t.Cell().Element(e => e.BorderTop(1).BorderColor(Colors.Grey.Lighten2).Padding(8)).AlignRight().Text($"{invoice.Total:C}").Bold();
                                });
                            });
                        });
                    });

                    // Footer note
                    col.Item().PaddingTop(18).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                    col.Item().PaddingTop(6).Text("Thank you for your business!").FontSize(10).FontColor(Colors.Grey.Darken1).AlignCenter();
                });
            });
        });

        return pdf.GeneratePdf();
    }
}