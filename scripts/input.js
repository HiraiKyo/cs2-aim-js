import { Instance } from "cs_script/point_script";

Instance.OnPlayerActivate(({ player }) => {
  var slot = player.GetPlayerSlot();
  Instance.Msg("Welcome, Player " + player.GetPlayerSlot());

  Instance.ClientCommand(slot, "echo \"CStrafe keybindings set.\"");

  Instance.Msg("Keybindings set for Player " + player.GetPlayerSlot());
});