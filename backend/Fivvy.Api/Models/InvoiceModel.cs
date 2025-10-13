using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Fivvy.Api.Models;

public class InvoiceModel
{
    [Key]
    public int Id { get; set; }
    public string? InvoiceNumber { get; set; }
    public int ClientId { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public ICollection<InvoiceLineItemModel> LineItems { get; set; } = new List<InvoiceLineItemModel>();

    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string? Notes { get; set; }

    [JsonIgnore]
    public ClientModel? Client { get; set; }
}


public enum InvoiceStatus
{
    Draft,
    Sent,
    Paid,
    Overdue
}


public class InvoiceLineItemModel
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Total => Quantity * UnitPrice;

    [JsonIgnore]
    public InvoiceModel? Invoice { get; set; }
}