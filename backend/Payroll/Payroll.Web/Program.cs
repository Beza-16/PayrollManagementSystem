// using Microsoft.AspNetCore.Diagnostics;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.IdentityModel.Tokens;
// using System.Text;
// using System.Text.Json.Serialization;
// using Microsoft.OpenApi.Models;
// using payroll.web.Data;
// using FluentValidation;
// using payroll.web.Controllers;

// try
// {
//     var builder = WebApplication.CreateBuilder(args);

//     builder.WebHost.ConfigureKestrel(options =>
//     {
//         options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
//         options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
//     });

//     builder.Services.AddControllers()
//         .AddJsonOptions(options =>
//         {
//             options.JsonSerializerOptions.PropertyNamingPolicy = null;
//             options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
//         });



//     builder.Services.AddCors(options =>
//     {
//         options.AddPolicy("AllowFrontend", builder =>
//         {
//             builder.WithOrigins("http://localhost:3002", "https://localhost:3002")
//                    .AllowAnyMethod()
//                    .AllowAnyHeader()
//                    .AllowCredentials();
//         });
//     });

//     builder.Services.AddDbContext<PayrollDbContext>(options =>
//         options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
//                .LogTo(Console.WriteLine, LogLevel.Information)); // Enable EF Core logging to console

//     builder.Services.AddAuthentication(options =>
//     {
//         options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
//         options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
//     }).AddJwtBearer(options =>
//     {
//         options.TokenValidationParameters = new TokenValidationParameters
//         {
//             ValidateIssuer = true,
//             ValidateAudience = true,
//             ValidateLifetime = true,
//             ValidateIssuerSigningKey = true,
//             ValidIssuer = builder.Configuration["Jwt:Issuer"],
//             ValidAudience = builder.Configuration["Jwt:Audience"],
//             IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]
//                 ?? throw new InvalidOperationException("JWT Key is not configured.")))
//         };
//     });

//     builder.Services.AddEndpointsApiExplorer();
//     builder.Services.AddSwaggerGen(c =>
//     {
//         c.SwaggerDoc("v1", new OpenApiInfo { Title = "Payroll API", Version = "v1" });
//         var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
//         var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
//         if (File.Exists(xmlPath))
//         {
//             c.IncludeXmlComments(xmlPath);
//         }
//         c.DocInclusionPredicate((_, api) => true);
//     });

//     var app = builder.Build();

//     app.UseExceptionHandler(errorApp =>
//     {
//         errorApp.Run(async context =>
//         {
//             context.Response.StatusCode = StatusCodes.Status500InternalServerError;
//             context.Response.ContentType = "application/json";
//             var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
//             if (exceptionHandlerPathFeature != null)
//             {
//                 var exception = exceptionHandlerPathFeature.Error;
//                 var errorMessage = exception.Message;
//                 var inner = exception.InnerException;
//                 while (inner != null)
//                 {
//                     errorMessage += $" | Inner: {inner.Message}";
//                     inner = inner.InnerException;
//                 }
//                 Console.WriteLine($"[GlobalExceptionHandler] Unhandled exception: {errorMessage}\nStackTrace: {exception.StackTrace}");
//                 await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
//                 {
//                     error = "An unexpected error occurred",
//                     details = errorMessage
//                 }));
//             }
//         });
//     });

//     app.UseSwagger();
//     app.UseSwaggerUI(c =>
//     {
//         c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payroll API V1");
//         c.RoutePrefix = "swagger";
//     });

//     if (!app.Environment.IsDevelopment())
//     {
//         app.UseHttpsRedirection();
//     }

//     app.UseCors("AllowFrontend");
//     app.UseAuthentication();
//     app.UseAuthorization();
//     app.MapControllers();

//     app.Run();
// }
// catch (Exception ex)
// {
//     Console.WriteLine($"Application failed to start: {ex.Message}");
//     Console.WriteLine($"Stack Trace: {ex.StackTrace}");
//     if (ex.InnerException != null)
//     {
//         Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
//         Console.WriteLine($"Inner Stack Trace: {ex.InnerException.StackTrace}");
//     }
//     throw;
// }





using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.OpenApi.Models;
using payroll.web.Data;
using FluentValidation;
using payroll.web.Controllers;

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.WebHost.ConfigureKestrel(options =>
    {
        options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
        options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
    });

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = null;
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        });

    // Store the configuration to use in CORS policy
    var configuration = builder.Configuration;
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", corsBuilder =>
        {
            var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
            if (allowedOrigins == null || allowedOrigins.Length == 0)
            {
                throw new InvalidOperationException("CORS allowed origins are not configured in appsettings.json.");
            }
            corsBuilder.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
        });
    });

    builder.Services.AddDbContext<PayrollDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
               .LogTo(Console.WriteLine, LogLevel.Information)); // Enable EF Core logging to console

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    }).AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]
                ?? throw new InvalidOperationException("JWT Key is not configured.")))
        };
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo { Title = "Payroll API", Version = "v1" });
        var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
        {
            c.IncludeXmlComments(xmlPath);
        }
        c.DocInclusionPredicate((_, api) => true);

        // Add JWT Authentication to Swagger
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            In = ParameterLocation.Header,
            Description = "Please enter JWT with Bearer into field (e.g., 'Bearer <token>')",
            Name = "Authorization",
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    var app = builder.Build();

    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
            if (exceptionHandlerPathFeature != null)
            {
                var exception = exceptionHandlerPathFeature.Error;
                var errorMessage = exception.Message;
                var inner = exception.InnerException;
                while (inner != null)
                {
                    errorMessage += $" | Inner: {inner.Message}";
                    inner = inner.InnerException;
                }
                Console.WriteLine($"[GlobalExceptionHandler] Unhandled exception: {errorMessage}\nStackTrace: {exception.StackTrace}");
                await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(new
                {
                    error = "An unexpected error occurred",
                    details = errorMessage
                }));
            }
        });
    });

    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Payroll API V1");
        c.RoutePrefix = "swagger";
    });

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseCors("AllowFrontend");
    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Console.WriteLine($"Application failed to start: {ex.Message}");
    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
    if (ex.InnerException != null)
    {
        Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
        Console.WriteLine($"Inner Stack Trace: {ex.InnerException.StackTrace}");
    }
    throw;
}