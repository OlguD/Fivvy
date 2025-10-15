
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


    [HttpPut("me/update-password")]
    [Authorize]
    public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequestModel request)
    {
        try
        {
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            await _userRepository.UpdatePasswordAsync(token, request);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }


    [HttpPost("me/upload-profile-picture")]
    [Authorize]
    public async Task<IActionResult> UploadProfilePicture([FromForm] IFormFile file)
    {
        try
        {
            if (!AuthHeaderHelper.TryGetBearerToken(HttpContext, out var token))
            {
                return Unauthorized("Token not found");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            // Dosya kaydetme yolu
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "profile-images");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var fileName = $"user_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // URL veya yol olarak kaydet (ör: /profile-images/filename.jpg)
            var relativePath = $"/profile-images/{fileName}";
            await _userRepository.UpdateProfileImagePathAsync(token, relativePath);
            return Ok(new { path = relativePath });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}