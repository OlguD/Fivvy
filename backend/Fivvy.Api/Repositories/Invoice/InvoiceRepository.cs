
using Fivvy.Api.Data;
using Fivvy.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace Fivvy.Api.Repositories.Invoice;


public class InvoiceRepository : IInvoiceRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;

    public InvoiceRepository(AppDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<InvoiceModel>> GetAllInvoiceAsync(string token)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);
        var invoices = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.LineItems)
            .Where(i => i.Client != null && i.Client.UserId == userId)
            .ToListAsync();

        return invoices;
    }

    public async Task<InvoiceModel> GetInvoiceAsync(string token, int invoiceId)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);

        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.Client != null && i.Client.UserId == userId);

        if (invoice is null)
        {
            throw new KeyNotFoundException($"Invoice {invoiceId} not found for current user");
        }

        return invoice;
    }

    public async Task<bool> CreateInvoiceAsync(string token, InvoiceModel model)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);

        var ownsClient = await _context.Clients.AnyAsync(c => c.Id == model.ClientId && c.UserId == userId);

        if (!ownsClient)
        {
            return false;
        }

        model.LineItems ??= new List<InvoiceLineItemModel>();

        await _context.Invoices.AddAsync(model);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> UpdateInvoiceAsync(string token, InvoiceModel invoice)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);

        var existing = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == invoice.Id && i.Client != null && i.Client.UserId == userId);

        if (existing is null)
        {
            return false;
        }

        var ownsTargetClient = await _context.Clients.AnyAsync(c => c.Id == invoice.ClientId && c.UserId == userId);

        if (!ownsTargetClient)
        {
            return false;
        }

        existing.InvoiceNumber = invoice.InvoiceNumber;
        existing.ClientId = invoice.ClientId;
        existing.InvoiceDate = invoice.InvoiceDate;
        existing.DueDate = invoice.DueDate;
        existing.Status = invoice.Status;
        existing.SubTotal = invoice.SubTotal;
        existing.Tax = invoice.Tax;
        existing.Total = invoice.Total;
        existing.Notes = invoice.Notes;

        var incomingLineItems = invoice.LineItems ?? new List<InvoiceLineItemModel>();
        var lineItemSet = _context.Set<InvoiceLineItemModel>();

        var incomingIds = incomingLineItems.Where(li => li.Id != 0).Select(li => li.Id).ToHashSet();

        foreach (var removed in existing.LineItems.Where(li => !incomingIds.Contains(li.Id)).ToList())
        {
            lineItemSet.Remove(removed);
        }

        foreach (var item in incomingLineItems)
        {
            if (item.Id != 0)
            {
                var target = existing.LineItems.First(li => li.Id == item.Id);
                target.Description = item.Description;
                target.Quantity = item.Quantity;
                target.UnitPrice = item.UnitPrice;
            }
            else
            {
                existing.LineItems.Add(new InvoiceLineItemModel
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice
                });
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<bool> DeleteInvoiceAsync(string token, int invoiceId)
    {
        var userId = _userRepository.ExtractUserIdFromToken(token);

        var invoice = await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.LineItems)
            .FirstOrDefaultAsync(i => i.Id == invoiceId && i.Client != null && i.Client.UserId == userId);

        if (invoice is null)
        {
            return false;
        }

        _context.Set<InvoiceLineItemModel>().RemoveRange(invoice.LineItems);
        _context.Invoices.Remove(invoice);
        await _context.SaveChangesAsync();

        return true;
    }
}