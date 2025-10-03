
using Fivvy.Api.Helpers;
using Fivvy.Api.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/client")]
public class ClientController : ControllerBase
{
    private readonly IClientRepository _clientRepository;
    private readonly JwtHelper _jwtHelper;

    public ClientController(IClientRepository clientRepository, JwtHelper jwtHelper)
    {
        _clientRepository = clientRepository;
        _jwtHelper = jwtHelper;
    }


    [HttpGet("clients")]
    [Authorize]
    public async Task<IActionResult> GetAllClients()
    {
        throw new NotImplementedException();
    }


    [HttpPost("add-client")]
    [Authorize]
    public async Task<IActionResult> AddClient()
    {
        throw new NotImplementedException();
    }


    [HttpPut("update-client")]
    [Authorize]
    public async Task<IActionResult> UpdateClient()
    {
        throw new NotImplementedException();
    }


    [HttpDelete("remove-client")]
    [Authorize]
    public async Task<IActionResult> RemoveClient()
    {
        throw new NotImplementedException();
    }
}