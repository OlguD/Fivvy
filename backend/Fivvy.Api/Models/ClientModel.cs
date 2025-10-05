using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Fivvy.Api.Models;


public class ClientModel
{
    [Key]
    public int Id { get; set; }
    public required string CompanyName { get; set; }
    public required string ContactName { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public int UserId { get; set; }

    [JsonIgnore]
    public UserModel? User { get; set; }

    public ICollection<ProjectModel> Projects { get; set; } = new List<ProjectModel>();

    public ICollection<InvoiceModel> Invoices { get; set; } = new List<InvoiceModel>();
}