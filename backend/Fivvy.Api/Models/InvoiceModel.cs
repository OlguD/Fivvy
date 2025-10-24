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
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Unapproved;
    public ICollection<InvoiceLineItemModel> LineItems { get; set; } = new List<InvoiceLineItemModel>();

    public decimal SubTotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string? Notes { get; set; }

    // Optional link to a project that this invoice is for
    public int? ProjectId { get; set; }
    [JsonIgnore]
    public ProjectModel? Project { get; set; }

    // When invoice is approved/paid by client
    public DateTime? PaidAt { get; set; }

    [JsonIgnore]
    public ClientModel? Client { get; set; }
}


public enum InvoiceStatus
{
    // Simplified status: whether the client has approved the invoice or not.
    Unapproved,
    Approved
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