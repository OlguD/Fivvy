
using Fivvy.Api.Utils;
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
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        var ClientList = await _clientRepository.GetAllClientsAsync(token);
        return Ok(ClientList);
    }


    [HttpPost("add-client")]
    [Authorize]
    public async Task<IActionResult> AddClient([FromBody] AddClientRequestModel request)
    {

        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        if (string.IsNullOrWhiteSpace(request.Email)) request.Email = "Email";
        if (string.IsNullOrWhiteSpace(request.Phone)) request.Phone = "Phone Number";
        if (string.IsNullOrWhiteSpace(request.Address)) request.Address = "Address";

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
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

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
        if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
        {
            return Unauthorized("Token not found");
        }

        if (await _clientRepository.RemoveClient(request.clientId, token))
        {
            return Ok();
        }
        return BadRequest();
    }
}