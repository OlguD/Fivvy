using Fivvy.Api.Models;

namespace Fivvy.Api.Repositories;


public interface IClientRepository
{
    Task<List<ClientModel>> GetAllClientsAsync(string token);
    Task<bool> AddClientAsync(ClientModel clientModel, string token);
    Task<bool> RemoveClient(int clientId, string token);
    Task<bool> UpdateClient(int clientId, string token, ClientModel clientModel);
}