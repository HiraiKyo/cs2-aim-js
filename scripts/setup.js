import { Instance } from "cs_script/point_script";

Instance.OnActivate(() => {
  Instance.ServerCommand("mp_freezetime 0");
  Instance.ServerCommand("mp_startmoney 16000");
  Instance.ServerCommand("mp_buy_anywhere 1");
  Instance.ServerCommand("mp_ignore_round_win_conditions 1");
  Instance.ServerCommand("sv_infinite_ammo 1");
  Instance.ServerCommand("mp_team_intro_time 0");
  Instance.ServerCommand("sv_regeneration_force_on 1");
  Instance.ServerCommand("ammo_grenade_limit_total 5");

  Instance.ServerCommand("mp_limitteams 0");
  Instance.ServerCommand("mp_autoteambalance 0");
  Instance.ServerCommand("mp_respawn_on_death_ct 1");
  Instance.ServerCommand("mp_respawn_on_death_t 1");

  Instance.ServerCommand("mp_warmup_end");
  Instance.ServerCommand("mp_warmup_offline_enabled 1");
  Instance.ServerCommand("mp_warmup_online_enabled 1");
  Instance.ServerCommand("mp_warmup_pausetimer 1");
  Instance.ServerCommand("mp_warmup_start");
});

Instance.OnPlayerActivate(({ player }) => {
  player.JoinTeam(1);
  Instance.ServerCommand("bot_stop 1");
  Instance.ServerCommand("bot_add_t");
});