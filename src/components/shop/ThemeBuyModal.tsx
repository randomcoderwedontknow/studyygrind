import type { ThemeId } from "../../types";
import { themes } from "../../data/themes";
import { themePurchasePrice, themeLiquidPrice } from "../../lib/pricing";
import { economyShopPrice, economyShopPriceScaled } from "../../lib/economy-pricing";
import { ownsThemeClassic, ownsThemeLiquid } from "../../lib/theme-variants";
import type { UserData } from "../../types";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

type Props = {
  open: boolean;
  themeId: ThemeId | null;
  user: UserData;
  onClose: () => void;
  onBuy: (id: ThemeId, surface: "classic" | "liquid") => void;
  canUseCredit?: boolean;
};

export function ThemeBuyModal({ open, themeId, user, onClose, onBuy, canUseCredit }: Props) {
  if (!open || !themeId) return null;
  const meta = themes[themeId];
  const hasClassic = ownsThemeClassic(user, themeId);
  const hasLiquid = ownsThemeLiquid(user, themeId);
  const classicRaw = themePurchasePrice(meta.price, "classic", hasClassic, hasLiquid);
  const liquidRaw = themePurchasePrice(meta.price, "liquid", hasClassic, hasLiquid);
  const classicPay = economyShopPriceScaled(classicRaw, `theme-${themeId}-classic`, user.discount);
  const liquidPay = economyShopPriceScaled(liquidRaw, `theme-${themeId}-liquid`, user.discount);
  const classicFull = economyShopPrice(meta.price, `theme-${themeId}`, user.discount);
  const liquidFull = economyShopPriceScaled(themeLiquidPrice(meta.price), `theme-${themeId}-liquid`, user.discount);

  return (
    <Modal open={open} title={`Buy ${meta.name}`} onClose={onClose}>
      <p className="soft">Normal uses the base colour. Liquid is a brighter variant plus glass UI surfaces.</p>
      {!hasClassic && (
        <div className="card tint" style={{ marginBottom: 8 }}>
          <b>Normal version</b>
          <p className="soft">Base palette, flat surfaces.</p>
          <PressableButton onClick={() => onBuy(themeId, "classic")}>
            {canUseCredit && !hasLiquid ? "Use trophy credit" : `${classicPay.toLocaleString()} pts`}
            {!hasLiquid && classicPay < classicFull ? ` (full ${classicFull.toLocaleString()})` : ""}
          </PressableButton>
        </div>
      )}
      {!hasLiquid && (
        <div className="card tint">
          <b>Liquid version</b>
          <p className="soft">Shifted colour + liquid glass UI.</p>
          <PressableButton onClick={() => onBuy(themeId, "liquid")}>
            {`${liquidPay.toLocaleString()} pts`}
            {hasClassic && liquidPay < liquidFull ? " (upgrade)" : liquidPay < liquidFull ? ` (full ${liquidFull.toLocaleString()})` : ""}
          </PressableButton>
        </div>
      )}
      {hasClassic && hasLiquid && <p className="soft">You own both — equip from the shop card.</p>}
      <PressableButton variant="ghost" onClick={onClose}>
        Cancel
      </PressableButton>
    </Modal>
  );
}
