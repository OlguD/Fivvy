using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Fivvy.Api.Models;

public class InvoiceModel
{
    [Key]
    public int Id { get; set; }
    public int InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public decimal Amount { get; set; }
    public int ClientId { get; set; }

    [JsonIgnore]
    public ClientModel? Client { get; set; }
}