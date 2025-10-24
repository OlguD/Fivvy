using Microsoft.EntityFrameworkCore;
using Fivvy.Api.Repositories;
using Fivvy.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Fivvy.Api.Helpers;
using Fivvy.Api.Repositories.Invoice;
using Microsoft.Extensions.FileProviders;
using Fivvy.Api.Services;
using QuestPDF;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Fivvy API",
        Version = "v1",
        Description = "Fivvy Invoice Management API"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using Bearer scheme",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type =Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// JWT TOKEN Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"] ?? throw new InvalidOperationException("JWT Secret is not configured");
var issuer = jwtSettings["Issuer"] ?? throw new InvalidOperationException("JWT Issuer is not configured");
var audience = jwtSettings["Audience"] ?? throw new InvalidOperationException("JWT Audience is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = issuer,
        ValidAudience = audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

//Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IClientRepository, ClientRepository>();
builder.Services.AddScoped<IDashboardRepository, DashboardRepository>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();
builder.Services.AddScoped<IClientPortalTokenRepository, ClientPortalTokenRepository>();
builder.Services.AddScoped<JwtHelper>();
builder.Services.AddScoped<PDFService>();

builder.Services.AddControllers();

// CORS - Frontend portuna izin ver
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


var app = builder.Build();

// Configure QuestPDF license (Community). Adjust license type if your organization requires a commercial license.
Settings.License = LicenseType.Community;
// Enable QuestPDF debug mode in development to produce detailed layout diagnostics when errors occur
Settings.EnableDebugging = false; // default off; we'll enable per-environment below

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Fivvy API V1");
        c.RoutePrefix = string.Empty;
    });
    // Enable detailed QuestPDF debug output in development to help identify layout problems
    QuestPDF.Settings.EnableDebugging = true;
}

// CORS EN BAŞTA
app.UseCors("AllowFrontend");

// Statik dosya sunumu - Authentication/Authorization olmadan
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "profile-images")),
    RequestPath = "/profile-images",
    ServeUnknownFileTypes = true,
    DefaultContentType = "image/jpeg",
    OnPrepareResponse = ctx =>
    {
        // CORS header'larını her response'a ekle
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "http://localhost:4200");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, OPTIONS");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Credentials", "true");
    }
});

app.UseStaticFiles(); // Default wwwroot için

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();