module.exports = {
  apps: [
    {
      name: 'ticketmaster',
      script: 'cmd.exe',
      args: ['/c', 'npm start'],
      cwd: 'C:\\Users\\HP OMEN\\Desktop\\Ticketmaster\\ticketmaster',
      windowsHide: true,
      autorestart: true,
      max_restarts: 20,
      restart_delay: 3000,
    },
  ],
}
