const CLIENT_ID = 'c191d483362f47229c49c503d9e23d6d'
const CLIENT_SECRET = '4395d71caf9645e99e54c96a62d4f32f'

class SpotifyService {
  constructor() {
    this.accessToken = null
    this.tokenExpirationTime = null
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpirationTime > Date.now()) {
      return this.accessToken
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
      },
      body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpirationTime = Date.now() + (data.expires_in * 1000)
    return this.accessToken
  }

  async searchTracks(query) {
    const token = await this.getAccessToken()
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )
    const data = await response.json()
    return data.tracks.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      albumArt: track.album.images[0]?.url,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls.spotify
    }))
  }
}

export default new SpotifyService() 