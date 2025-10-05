
using Fivvy.Api.Utils;
using Fivvy.Api.Models.RequestModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IUserRepository _userRepository;

    public ProfileController(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }


    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Profile()
    {
        try
        {
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            var user = await _userRepository.Profile(token);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpPut("me/update-profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestModel request)
    {
        try
        {
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            var user = await _userRepository.UpdateProfile(token, request);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}