
using Fivvy.Api.Models;
namespace Fivvy.Api.Repositories.Invoice;


public interface IInvoiceRepository
{
    Task<IEnumerable<InvoiceModel>> GetAllInvoiceAsync(string token);
    Task<InvoiceModel> GetInvoiceByIdAsync(string token, int invoiceId);
    Task<bool> CreateInvoiceAsync(string token, InvoiceModel model);
    Task<bool> UpdateInvoiceAsync(string token, InvoiceModel invoice);
    Task<bool> DeleteInvoiceAsync(string token, int invoiceId);
}