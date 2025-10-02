
using System.Security.Claims;
using Fivvy.Api.Exceptions;
using Fivvy.Api.Models;
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
            // Token'ı header'dan al
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            // Bearer prefix'i varsa kaldır, yoksa token'ı olduğu gibi kullan
            var token = authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) 
                ? authHeader.Substring(7) // "Bearer " 7 karakter
                : authHeader;

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
    public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileRequestModel request)
    {
        try
        {
            // Token'ı header'dan al
            var authHeader = HttpContext.Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader))
            {
                return Unauthorized("Token not found");
            }

            var token = authHeader.StartsWith("Bearer")
                ? authHeader.Replace("Bearer ", "")
                : authHeader;

            var user = await _userRepository.UpdateProfile(token, request);
            return Ok(user);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}