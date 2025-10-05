
using Fivvy.Api.Helpers;
using Fivvy.Api.Models;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/client")]
public class ClientController : ControllerBase
{
    private readonly IClientRepository _clientRepository;

    public ClientController(IClientRepository clientRepository)
    {
        _clientRepository = clientRepository;
    }


    [HttpGet("clients")]
    [Authorize]
    public async Task<IActionResult> GetAllClients()
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader))
        {
            return Unauthorized("Token not found");
        }
        var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader.Substring(7) // "Bearer " 7 karakter
            : authHeader;

        var ClientList = await _clientRepository.GetAllClientsAsync(token);
        return Ok(ClientList);
    }


    [HttpPost("add-client")]
    [Authorize]
    public async Task<IActionResult> AddClient([FromBody] AddClientRequestModel request)
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader))
        {
            return Unauthorized("Token not found");
        }
        var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader.Substring(7) // "Bearer " 7 karakter
            : authHeader;

        if (string.IsNullOrEmpty(request.Email)) request.Email = "Email";
        if (string.IsNullOrEmpty(request.Phone)) request.Phone = "Phone Number";
        if (string.IsNullOrEmpty(request.Address)) request.Address = "Address";

        var clientModel = new ClientModel
        {
            CompanyName = request.CompanyName,
            ContactName = request.ContactName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address
        };

        if (await _clientRepository.AddClientAsync(clientModel, token))
        {
            return Ok();
        }
        return BadRequest();
    }


    [HttpPut("update-client")]
    [Authorize]
    public async Task<IActionResult> UpdateClient([FromBody] UpdateClientRequestModel request)
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader))
        {
            return Unauthorized("Token not found");
        }
        var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader.Substring(7) // "Bearer " 7 karakter
            : authHeader;

        if (await _clientRepository.UpdateClientAsync(request.clientId, token, request.clientModel))
        {
            return Ok();
        }
        return BadRequest();
    }


    [HttpDelete("remove-client")]
    [Authorize]
    public async Task<IActionResult> RemoveClient([FromBody] RemoveClientRequestModel request)
    {
        var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader))
        {
            return Unauthorized("Token not found");
        }
        var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authHeader.Substring(7) // "Bearer " 7 karakter
            : authHeader;

        if (await _clientRepository.RemoveClient(request.clientId, token))
        {
            return Ok();
        }
        return BadRequest();
    }
}