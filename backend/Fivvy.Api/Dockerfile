FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# copy csproj and restore as distinct layers
COPY ["Fivvy.Api.csproj", "./"]
RUN dotnet restore "./Fivvy.Api.csproj"

# copy everything else and build
COPY . .
RUN dotnet publish "Fivvy.Api.csproj" -c Release -o /app/publish /p:TrimUnusedDependencies=true

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Fivvy.Api.dll"]
