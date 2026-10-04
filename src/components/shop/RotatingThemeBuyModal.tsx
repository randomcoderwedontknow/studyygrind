import { rotatingThemeById } from "../../data/pools/rotating-themes";
import { themePurchasePrice } from "../../lib/pricing";
import { economyShopPrice, economyShopPriceScaled } from "../../lib/economy-pricing";
import { ownsRotatingClassic, ownsRotatingLiquid } from "../../lib/theme-variants";
import type { ThemeSurface, UserData } from "../../types";
import { Modal } from "../ui/Modal";
import { PressableButton } from "../ui/PressableButton";

type Props = {
  open: boolean;
  themeId: string | null;
  user: UserData;
  onClose: () => void;
  onBuy: (id: string, surface: ThemeSurface) => void;
};

export function RotatingThemeBuyModal({ open, themeId, user, onClose, onBuy }: Props) {
  if (!open || !themeId) return null;
  const meta = rotatingThemeById(themeId);
  if (!meta) return null;
  const hasClassic = ownsRotatingClassic(user, themeId);
  const hasLiquid = ownsRotatingLiquid(user, themeId);
  const classicPay = economyShopPriceScaled(
    themePurchasePrice(meta.price, "classic", hasClassic, hasLiquid),
    `rot-theme-${themeId}-classic`,
    user.discount,
  );
  const liquidPay = economyShopPriceScaled(
    themePurchasePrice(meta.price, "liquid", hasClassic, hasLiquid),
    `rot-theme-${themeId}-liquid`,
    user.discount,
  );

  return (
    <Modal open={open} title={`Buy ${meta.name}`} onClose={onClose}>
      <p className="soft">Daily focus colour — keep forever in Owned Colours.</p>
      {!hasClassic && (
        <div className="card tint" style={{ marginBottom: 8 }}>
          <b>Normal</b>
          <PressableButton onClick={() => onBuy(themeId, "classic")}>{classicPay.toLocaleString()} pts</PressableButton>
        </div>
      )}
      {!hasLiquid && (
        <div className="card tint">
          <b>Liquid</b>
          <PressableButton onClick={() => onBuy(themeId, "liquid")}>
            {liquidPay.toLocaleString()} pts{hasClassic ? " (upgrade)" : ""}
          </PressableButton>
        </div>
      )}
      {!hasClassic && !hasLiquid && (
        <small className="soft">
          Normal from {economyShopPrice(meta.price, `rot-theme-${themeId}`, user.discount).toLocaleString()} · Liquid{" "}
          {economyShopPriceScaled(themePurchasePrice(meta.price, "liquid", false, false), `rot-theme-${themeId}-liquid`, user.discount).toLocaleString()}
        </small>
      )}
      <PressableButton variant="ghost" onClick={onClose}>
        Cancel
      </PressableButton>
    </Modal>
  );
}
