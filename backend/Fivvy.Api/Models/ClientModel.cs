using System.ComponentModel.DataAnnotations;
namespace Fivvy.Api.Models;


public class ClientModel
{
    [Key]
    public int Id { get; set; }
    public string? CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public DateTime CreatedAt;

    public ICollection<ProjectModel> Projects { get; set; } = new List<ProjectModel>();
    public ICollection<InvoiceModel> Invoices { get; set; } = new List<InvoiceModel>();
}