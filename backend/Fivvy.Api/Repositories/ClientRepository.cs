

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
            var user = await _userRepository.GetUserById(userId);

            var newClient = new ClientModel
            {
                CompanyName = clientModel.CompanyName,
                ContactName = clientModel.ContactName,
                Email = clientModel.Email,
                Phone = clientModel.Phone,
                Address = clientModel.Address,
                CreatedAt = DateTime.Now,
                UserId = userId,
                User = user
            };

            _context.Clients.Add(newClient);
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            throw new Exception($"An error occured while adding client: {ex.Message}");
        }
    }


    public async Task<bool> UpdateClient(int clientId, string token, ClientModel clientModel)
    {
        try
        {
            var userId = _userRepository.ExtractUserIdFromToken(token);
            var user = await _userRepository.GetUserById(userId);
            var updateClient = await _context.Clients
                .Where(c => c.Id == clientId && c.UserId == userId)
                .FirstOrDefaultAsync();

            if (updateClient != null)
            {
                var newClient = new ClientModel
                {
                    CompanyName = clientModel.CompanyName,
                    ContactName = clientModel.ContactName,
                    Email = clientModel.Email,
                    Phone = clientModel.Phone,
                    Address = clientModel.Address,
                    CreatedAt = DateTime.Now,
                    UserId = userId,
                    User = user
                };

                _context.Clients.Update(newClient);
                await _context.SaveChangesAsync();
                return true;
            }
            return false;
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