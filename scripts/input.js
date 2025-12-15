import { Instance } from "cs_script/point_script";

Instance.OnPlayerActivate(({ player }) => {
  var slot = player.GetPlayerSlot();
  Instance.Msg("Welcome, Player " + player.GetPlayerSlot());

  Instance.ClientCommand(slot, 'alias +W "ent_fire cstrafe_main RunScriptInput W_Pressed"')
  Instance.ClientCommand(slot, 'alias -W "ent_fire cstrafe_main RunScriptInput W_Released"')
  Instance.ClientCommand(slot, 'alias +A "ent_fire cstrafe_main RunScriptInput A_Pressed"')
  Instance.ClientCommand(slot, 'alias -A "ent_fire cstrafe_main RunScriptInput A_Released"')
  Instance.ClientCommand(slot, 'alias +S "ent_fire cstrafe_main RunScriptInput S_Pressed"')
  Instance.ClientCommand(slot, 'alias -S "ent_fire cstrafe_main RunScriptInput S_Released"')
  Instance.ClientCommand(slot, 'alias +D "ent_fire cstrafe_main RunScriptInput D_Pressed"')
  Instance.ClientCommand(slot, 'alias -D "ent_fire cstrafe_main RunScriptInput D_Released"')
  Instance.ClientCommand(slot, 'alias +fire "ent_fire cstrafe_main RunScriptInput Fire_Pressed"')
  Instance.ClientCommand(slot, 'alias -fire "ent_fire cstrafe_main RunScriptInput Fire_Released"')
  Instance.ClientCommand(slot, "bind w +W")
  Instance.ClientCommand(slot, "bind a +A")
  Instance.ClientCommand(slot, "bind s +S")
  Instance.ClientCommand(slot, "bind d +D")
  Instance.ClientCommand(slot, "bind mouse1 +fire")

  Instance.ClientCommand(slot, "echo \"CStrafe keybindings set.\"");

  Instance.Msg("Keybindings set for Player " + player.GetPlayerSlot());
});