import type { ComponentType } from 'react';
import type { IllustrationProps } from './bangers/FlatTopSvg';

import FlatTopSvg from './bangers/FlatTopSvg';
import BeveledSvg from './bangers/BeveledSvg';
import OpaqueBottomSvg from './bangers/OpaqueBottomSvg';
import ThermalSvg from './bangers/ThermalSvg';
import RoundBottomSvg from './bangers/RoundBottomSvg';
import CoreReactorSvg from './bangers/CoreReactorSvg';
import SwingArmSvg from './bangers/SwingArmSvg';
import TerpSlurperSvg from './bangers/TerpSlurperSvg';
import BlenderSvg from './bangers/BlenderSvg';
import SpinnerSvg from './bangers/SpinnerSvg';
import ControlTowerSvg from './bangers/ControlTowerSvg';
import CharmerSvg from './bangers/CharmerSvg';
import InsertSvg from './bangers/InsertSvg';
import EBangerSvg from './bangers/EBangerSvg';

import LiveRosinSvg from './concentrates/LiveRosinSvg';
import ColdCureSvg from './concentrates/ColdCureSvg';
import FreshPressSvg from './concentrates/FreshPressSvg';
import RosinJamSvg from './concentrates/RosinJamSvg';
import RosinBadderSvg from './concentrates/RosinBadderSvg';
import HotCureSvg from './concentrates/HotCureSvg';
import HighMeltRosinSvg from './concentrates/HighMeltRosinSvg';
import LiveResinSvg from './concentrates/LiveResinSvg';
import CuredResinSvg from './concentrates/CuredResinSvg';
import ShatterSvg from './concentrates/ShatterSvg';
import WaxBudderSvg from './concentrates/WaxBudderSvg';
import CrumbleSvg from './concentrates/CrumbleSvg';
import SugarSvg from './concentrates/SugarSvg';
import SauceHtfseSvg from './concentrates/SauceHtfseSvg';
import ThcaDiamondsSvg from './concentrates/ThcaDiamondsSvg';
import DiamondsSauceSvg from './concentrates/DiamondsSauceSvg';
import CrystallineSvg from './concentrates/CrystallineSvg';
import LiquidDiamondsSvg from './concentrates/LiquidDiamondsSvg';

export type { IllustrationProps };

const BANGER_MAP: Record<string, ComponentType<IllustrationProps>> = {
  'flat-top':       FlatTopSvg,
  'beveled':        BeveledSvg,
  'opaque-bottom':  OpaqueBottomSvg,
  'thermal':        ThermalSvg,
  'round-bottom':   RoundBottomSvg,
  'core-reactor':   CoreReactorSvg,
  'swing-arm':      SwingArmSvg,
  'terp-slurper':   TerpSlurperSvg,
  'blender':        BlenderSvg,
  'spinner':        SpinnerSvg,
  'control-tower':  ControlTowerSvg,
  'charmer':        CharmerSvg,
  'insert':         InsertSvg,
  'e-banger':       EBangerSvg,
};

const CONCENTRATE_MAP: Record<string, ComponentType<IllustrationProps>> = {
  'live-rosin':       LiveRosinSvg,
  'cold-cure':        ColdCureSvg,
  'fresh-press':      FreshPressSvg,
  'rosin-jam':        RosinJamSvg,
  'rosin-badder':     RosinBadderSvg,
  'hot-cure':         HotCureSvg,
  'high-melt-rosin':  HighMeltRosinSvg,
  'live-resin':       LiveResinSvg,
  'cured-resin':      CuredResinSvg,
  'shatter':          ShatterSvg,
  'wax-budder':       WaxBudderSvg,
  'crumble':          CrumbleSvg,
  'sugar':            SugarSvg,
  'sauce-htfse':      SauceHtfseSvg,
  'thca-diamonds':    ThcaDiamondsSvg,
  'diamonds-sauce':   DiamondsSauceSvg,
  'crystalline':      CrystallineSvg,
  'liquid-diamonds':  LiquidDiamondsSvg,
};

export function getBangerIllustration(id: string): ComponentType<IllustrationProps> | null {
  return BANGER_MAP[id] ?? null;
}

export function getConcentrateIllustration(id: string): ComponentType<IllustrationProps> | null {
  return CONCENTRATE_MAP[id] ?? null;
}
