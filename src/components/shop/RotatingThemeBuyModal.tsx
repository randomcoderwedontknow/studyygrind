import { rotatingThemeById } from "../../data/pools/rotating-themes";
import { applyDiscount, shopDisplayPrice, themePurchasePrice, themeLiquidPrice } from "../../lib/pricing";
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
  const classicPay = applyDiscount(themePurchasePrice(meta.price, "classic", hasClassic, hasLiquid), user.discount);
  const liquidPay = applyDiscount(themePurchasePrice(meta.price, "liquid", hasClassic, hasLiquid), user.discount);
  const classicFull = shopDisplayPrice(meta.price, user.discount);

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
        <small className="soft">Normal from {classicFull.toLocaleString()} · Liquid {applyDiscount(themeLiquidPrice(meta.price), user.discount).toLocaleString()}</small>
      )}
      <PressableButton variant="ghost" onClick={onClose}>
        Cancel
      </PressableButton>
    </Modal>
  );
}
