using Fivvy.Api.Models;
using Fivvy.Api.Models.Dto;

namespace Fivvy.Api.Repositories;


public interface IClientPortalTokenRepository
{
    Task<string> CreateTokenAsync(int clientId, TimeSpan ttl);
    Task<ClientPortalTokenModel?> ValidateTokenAsync(int clientId, string token, bool markUsed = false);

    Task<PortalDataDto?> GetPortalDataAsync(int clientId, string token);
    Task<bool> ApproveInvoiceAsync(int clientId, int invoiceId, string token);
}
