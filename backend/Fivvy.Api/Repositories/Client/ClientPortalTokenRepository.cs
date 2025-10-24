using System.Security.Cryptography;
using System.Text;
using Fivvy.Api.Data;
using Fivvy.Api.Models;
using Fivvy.Api.Models.Dto;

using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;


public class ClientPortalTokenRepository : IClientPortalTokenRepository
{
    private readonly AppDbContext _context;
    public ClientPortalTokenRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> CreateTokenAsync(int clientId, TimeSpan ttl)
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        var token = WebEncoders.Base64UrlEncode(bytes);
        var hash = ComputeHash(token);

        var entity = new ClientPortalTokenModel
        {
            ClientId = clientId,
            TokenHash = hash,
            ExpiresAt = DateTime.UtcNow.Add(ttl),
            CreatedAt = DateTime.UtcNow
        };

        _context.ClientPortalToken.Add(entity);
        await _context.SaveChangesAsync();
        return token;
    }


    public async Task<ClientPortalTokenModel?> ValidateTokenAsync(int clientId, string token, bool markUsed = false)
    {
        var hash = ComputeHash(token);
        var t = await _context.ClientPortalToken.FirstOrDefaultAsync(x => x.TokenHash == hash && x.ClientId == clientId);
        if (t == null)
        {
            return null;
        }
        if (t.ExpiresAt < DateTime.UtcNow)
        {
            return null;
        }
        if (t.IsUsed)
        {
            return null;
        }
        if (markUsed)
        {
            t.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return t;
    }

    private static string ComputeHash(string token)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    public async Task<PortalDataDto?> GetPortalDataAsync(int clientId, string token)
    {
        var t = await ValidateTokenAsync(clientId, token, markUsed: false);
        if (t == null) return null;

        var client = await _context.Clients
            .AsNoTracking()
            .Where(c => c.Id == clientId)
            .Select(c => new PortalClientDto(c.Id, c.ContactName, c.Email, c.CompanyName))
            .FirstOrDefaultAsync();

        if (client == null) return null;

        var projects = await _context.Projects
            .AsNoTracking()
            .Where(p => p.ClientId == clientId)
            .Select(p => new PortalProjectDto(p.Id, p.ProjectName, p.IsActive, p.ProjectPrice))
            .ToListAsync();

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Where(i => i.ClientId == clientId)
            .Select(i => new PortalInvoiceDto(i.Id, i.InvoiceNumber, i.Status, i.Total, i.DueDate, i.InvoiceDate))
            .ToListAsync();

        return new PortalDataDto(client, projects, invoices);
    }

    public async Task<bool> ApproveInvoiceAsync(int clientId, int invoiceId, string token)
    {
        // First quick validate
        var tokenEntity = await ValidateTokenAsync(clientId, token, markUsed: false);
        if (tokenEntity == null) return false;

        // Perform the work inside a transaction and mark token used atomically
        using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            var tokenForUpdate = await ValidateTokenAsync(clientId, token, markUsed: true);
            if (tokenForUpdate == null)
            {
                await tx.RollbackAsync();
                return false;
            }

            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId && i.ClientId == clientId);
            if (invoice == null)
            {
                await tx.RollbackAsync();
                return false;
            }

            // Mark invoice as approved by client
            invoice.Status = Models.InvoiceStatus.Approved;
            invoice.PaidAt = DateTime.UtcNow;

            if (invoice.ProjectId.HasValue)
            {
                var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == invoice.ProjectId.Value);
                if (project != null && !project.IsActive)
                {
                    project.IsActive = true;
                    project.StartDate = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();
            await tx.CommitAsync();
            return true;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}