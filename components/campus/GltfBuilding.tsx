"use client";

/*
 * GltfBuilding — 캠퍼스 건물을 glTF 모델로 그리는 컴포넌트.
 *
 * - 모델: Kenney "City Kit Industrial / Commercial" (CC0). public/models/CREDITS.md 참고.
 * - 원본은 회색·남색 단색이라, 셰이더로 "밝은 벽면만" 건물 종류 색(+회사 색)을 입힘.
 *   창문·지붕 같은 어두운 부분은 원래 색을 유지 → 아이들이 색으로 건물 종류를 구분 가능.
 * - 레벨이 오르면 더 크고 화려한 모델로 바뀜 (1→2→3).
 * - 화면에 나온 건물 모델만 그때그때 불러옴 (모델당 약 40KB).
 */

import { Component, Suspense, useMemo, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { BuildingType } from "@/lib/engine";

/* ── 건물 종류 → 레벨별 모델 파일 (park는 기존 나무 공원 유지) ─────────── */
const BUILDING_MODELS: Partial<Record<BuildingType, [string, string, string]>> = {
  factory:   ["ind-building-g", "ind-building-l", "ind-building-m"],
  warehouse: ["ind-building-s", "ind-building-i", "ind-building-k"],
  power:     ["ind-building-c", "ind-building-e", "ind-building-f"],
  rnd:       ["ind-building-p", "ind-building-q", "ind-building-d"],
  lab:       ["ind-building-t", "ind-building-o", "ind-building-a"],
  gym:       ["ind-building-h", "ind-building-j", "ind-building-n"],
  office:    ["com-building-a", "com-building-f", "com-building-skyscraper-a"],
  hr:        ["com-building-d", "com-building-b", "com-building-l"],
  store:     ["com-building-c", "com-building-e", "com-building-i"],
  cafeteria: ["com-building-e", "com-building-c", "com-building-k"],
  dorm:      ["com-building-g", "com-building-n", "com-building-j"],
  daycare:   ["com-building-e", "com-building-h", "com-building-k"],
  clinic:    ["com-building-h", "com-building-g", "com-building-m"],
};

export function hasBuildingModel(type: BuildingType): boolean {
  return !!BUILDING_MODELS[type];
}
function modelUrl(type: BuildingType, level: number): string {
  const list = BUILDING_MODELS[type]!;
  return `/models/buildings/${list[Math.max(0, Math.min(2, level - 1))]}.glb`;
}

/** 건물이 차지할 바닥 크기 (타일 1칸 = 1) */
const FOOTPRINT = 0.86;

/* 밝은 벽면만 색을 입히는 셰이더 조각.
   lum(밝기)이 높을수록 tint 색 쪽으로 섞고, 어두운 창문·지붕은 그대로 둠. */
function makeTintMaterial(src: THREE.Material, tint: THREE.Color, glow: boolean): THREE.Material {
  const m = (src as THREE.MeshStandardMaterial).clone();
  m.emissive = new THREE.Color(glow ? "#6366f1" : "#000000");
  m.emissiveIntensity = glow ? 0.35 : 0;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTint = { value: tint };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec3 uTint;\nvoid main() {")
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          // 2톤 칠하기: 밝은 벽 → 밝은 종류 색, 짙은 남색 띠·지붕 → 진한 종류 색. 창문(파란색)은 원래 색 유지.
          "vec3 src = diffuseColor.rgb;",
          "float lum = dot( src, vec3( 0.299, 0.587, 0.114 ) );",
          "float wall = smoothstep( 0.25, 0.5, lum );",
          "float window = smoothstep( 0.1, 0.2, src.b - src.r ) * smoothstep( 0.08, 0.2, lum );",
          "vec3 light = mix( src, uTint, 0.55 ) * 1.05;",
          "vec3 deep = mix( vec3( 0.07, 0.075, 0.1 ), uTint * 0.55, 0.6 );",
          "vec3 painted = mix( deep, light, wall );",
          "diffuseColor.rgb = mix( painted, src, window );",
        ].join("\n"),
      );
  };
  m.customProgramCacheKey = () => "campusTint";
  return m;
}

function GltfBuildingInner({
  type, level, tint, selected,
}: { type: BuildingType; level: number; tint: string; selected: boolean }) {
  const { scene } = useGLTF(modelUrl(type, level), false, true);

  // 건물마다 독립된 재질(색)을 갖도록 복제하고, 바닥 크기에 맞춰 크기·위치 조정
  const object = useMemo(() => {
    const color = new THREE.Color(tint).convertSRGBToLinear();
    const obj = scene.clone(true);
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((mt) => makeTintMaterial(mt, color, selected))
        : makeTintMaterial(mesh.material, color, selected);
    });
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = FOOTPRINT / Math.max(size.x, size.z);
    obj.position.set(-center.x * s, -box.min.y * s, -center.z * s);
    obj.scale.setScalar(s);
    const g = new THREE.Group();
    g.add(obj);
    return g;
  }, [scene, tint, selected]);

  return <primitive object={object} />;
}

/* 모델을 못 불러오면 기존 도형 건물로 대체 */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn("[GltfBuilding] 모델 로드 실패, 기본 건물 사용", err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function GltfBuilding(props: {
  type: BuildingType; level: number; tint: string; selected: boolean; fallback: ReactNode;
}) {
  const { fallback, ...rest } = props;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfBuildingInner {...rest} />
      </Suspense>
    </ModelBoundary>
  );
}
