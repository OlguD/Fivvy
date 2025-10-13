

using Fivvy.Api.Data;
using Fivvy.Api.Exceptions;
using Fivvy.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Fivvy.Api.Repositories;


public class ClientRepository : IClientRepository
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;

    public ClientRepository(AppDbContext context, IUserRepository userRepository)
    {
        _context = context;
        _userRepository = userRepository;
    }

    public async Task<List<ClientModel>> GetAllClientsAsync(string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);

            var clients = await _context.Clients
                .Include(c => c.User)
                .Include(c => c.Projects)
                .Include(c => c.Invoices)
                .Where(c => c.UserId == userId)
                .ToListAsync();

            return clients;
        }
        catch (Exception ex)
        {
            throw new ClientNotFoundException($"An error occured while getting clients: {ex.Message}", ex);
        }
    }

    public async Task<bool> AddClientAsync(ClientModel clientModel, string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);

            var newClient = new ClientModel
            {
                CompanyName = clientModel.CompanyName,
                ContactName = clientModel.ContactName,
                Email = clientModel.Email,
                Phone = clientModel.Phone,
                Address = clientModel.Address,
                CreatedAt = DateTime.Now,
                UserId = userId,
            };

            _context.Clients.Add(newClient);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex)
        {
            var details = ex.InnerException?.Message ?? ex.Message;
            throw new Exception($"An error occured while adding client: {details}", ex);
        }
    }


    public async Task<bool> UpdateClientAsync(int clientId, string token, ClientModel clientModel)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var existingClient = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == clientId && c.UserId == userId);

            if (existingClient == null)
            {
                return false;
            }

            existingClient.CompanyName = clientModel.CompanyName;
            existingClient.ContactName = clientModel.ContactName;
            existingClient.Email = clientModel.Email;
            existingClient.Phone = clientModel.Phone;
            existingClient.Address = clientModel.Address;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error while updating client: {ex.Message}");
        }
    }

    public async Task<bool> RemoveClient(int clientId, string token)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var existingClient = await _context.Clients
                .Where(c => c.Id == clientId && c.UserId == userId)
                .FirstOrDefaultAsync();

            if (existingClient != null)
            {
                _context.Clients.Remove(existingClient);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
        }
        catch (Exception ex)
        {
            throw new Exception($"Error while removing client: {ex.Message}");
        }
    }
}