using Microsoft.AspNetCore.Mvc;

using Fivvy.Api.Models;
using Fivvy.Api.Models.RequestModels;
using Fivvy.Api.Utils;
using Fivvy.Api.Helpers;
using Fivvy.Api.Exceptions;
using Microsoft.AspNetCore.Authorization;

namespace Fivvy.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly JwtHelper _jwtHelper;
    private readonly IUserRepository _userRepository;

    public AuthController(JwtHelper jwtHelper, IUserRepository userRepository)
    {
        _jwtHelper = jwtHelper;
        _userRepository = userRepository;
    }


    [HttpPost("login")]
    public async Task<IActionResult> UserLoginAsync([FromBody] LoginRequestModel request)
    {
        var user = await _userRepository.GetUserByUsername(request.Username);
        if (user != null && BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
        {
            var accessToken = _jwtHelper.GenerateToken(user.Id.ToString(), user.Email);
            var refreshToken = RefreshTokenHelper.CreateToken(); // 256 bit random string
            await _userRepository.UpsertRefreshTokenAsync(user.Id, refreshToken, HttpContext.Connection.RemoteIpAddress?.ToString());

            Response.Cookies.Append(
                "refreshToken",
                refreshToken,

                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTimeOffset.UtcNow.AddDays(7)
                }
            );

            return Ok(new { token = accessToken, user = new { user.Id, user.Email, user.Username, user.Role } });
        }
        return Unauthorized("Invalid credentials");
    }

    [HttpPost("register")]
    public async Task<IActionResult> UserRegisterAsync([FromBody] RegisterRequestModel request)
    {
        if (!ValidatePassword.validatePassword(request.Password, request.ValidatePassword))
        {
            return BadRequest(new { message = "Password does not match" });
        }

        var user = new UserModel
        {
            Username = request.Username,
            Name = request.Name,
            Surname = request.Surname,
            Email = request.Email,
            Password = request.Password,
            TotalIncome = 0,
        };

        try
        {
            await _userRepository.AddUserAsync(user);
            return Ok(new { success = true });
        }
        catch (UsernameAlreadyExistsException ex)
        {
            return Conflict(new { field = "username", message = ex.Message });
        }
        catch (EmailAlreadyExistsException ex)
        {
            return Conflict(new { field = "email", message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            var message = string.IsNullOrWhiteSpace(ex.Message) ? "Invalid registration data" : ex.Message;
            return BadRequest(new { message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "An unexpected error occurred while creating the account." });
        }
    }


    [HttpPost("refresh")]
    public async Task<IActionResult> RefreshAsync()
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
        {
            return Unauthorized();
        }

        var tokenRecord = await _userRepository.ValidateRefreshTokenAsync(refreshToken);
        if (tokenRecord is null || tokenRecord.ExpiresAt <= DateTime.UtcNow)
        {
            return Unauthorized();
        }

        var userEmail = tokenRecord.User?.Email ?? string.Empty;
        var accessToken = _jwtHelper.GenerateToken(tokenRecord.UserId.ToString(), userEmail);
        var newRefreshToken = RefreshTokenHelper.CreateToken();
        await _userRepository.RotateRefreshTokenAsync(tokenRecord.UserId, refreshToken, newRefreshToken);

        Response.Cookies.Append(
            "refreshToken",
            newRefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            }
        );

        return Ok(new { token = accessToken });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        if (Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
        {
            await _userRepository.RevokeRefreshTokenAsync(refreshToken);
        }

        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None
        });
        return NoContent();
    }
}