import { Instance } from "cs_script/point_script";

Instance.OnActivate(() => {
  Instance.ServerCommand("sv_cheats 1");
  Instance.ServerCommand("mp_freezetime 0");
  Instance.ServerCommand("mp_warmuptime 0");
  Instance.ServerCommand("mp_ignore_round_win_conditions 1");
  Instance.ServerCommand("sv_infinite_ammo 1");
  Instance.Msg("Server setup complete.");
});

Instance.OnPlayerActivate(({ player }) => {
  player.JoinTeam(2);
  Instance.ServerCommand("bot_stop 1");
  Instance.ServerCommand("bot_add");
  Instance.ServerCommand("bot_add");
});