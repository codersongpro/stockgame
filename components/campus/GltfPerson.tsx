"use client";

/*
 * GltfPerson — 블렌더로 만든 glTF(.glb) 인물 모델을 캠퍼스에 세우는 컴포넌트.
 *
 * - 모델: Quaternius "Ultimate Animated Character Pack" (CC0). public/models/CREDITS.md 참고.
 * - 파일은 gltf-transform으로 동작 3개(Idle·Walk·Victory)만 남기고 meshopt 압축 (1.2MB → 약 150KB).
 *   압축 해제기는 drei(three-stdlib)에 들어 있어 외부 CDN이 필요 없음 (학교망 안전).
 * - 같은 모델을 여러 명이 쓰므로 SkeletonUtils.clone 으로 뼈대까지 복제하고,
 *   옷(재킷) 재질만 사람마다 다른 색으로 바꿔 다양하게 보이게 함.
 */

import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

/* ── 모델 목록: 종류를 늘릴 때 여기만 추가 ─────────────────────────────── */
// 재질 이름 → 사람마다 바꿀 색의 역할 (outfit: 옷, skin: 피부, hair: 머리)
// 원본 파일의 피부색이 거의 검정이라 피부는 항상 코드에서 지정함
export const PERSON_MODELS = {
  suitMale: { url: "/models/people/suit-male.glb", outfit: "Black", skin: "Skin", hair: "Hair" },
} as const;
export type PersonModelId = keyof typeof PERSON_MODELS;

/** 기존 상자 캐릭터의 키(머리 꼭대기 ≈ 0.39)에 맞춘 목표 키 */
const TARGET_HEIGHT = 0.4;

export type PersonAction = "walk" | "idle" | "cheer";
const CLIP: Record<PersonAction, string> = { walk: "Walk", idle: "Idle", cheer: "Victory" };

export type PersonColors = { outfit?: string; skin?: string; hair?: string };

function GltfPersonInner({
  model, action, colors, phase = 0,
}: { model: PersonModelId; action: PersonAction; colors: PersonColors; phase?: number }) {
  const group = useRef<THREE.Group>(null);
  // useGLTF(경로, draco 사용 안 함, meshopt 사용)
  const { scene, animations } = useGLTF(PERSON_MODELS[model].url, false, true);

  // 사람마다 독립된 뼈대·재질을 갖도록 복제하고, 키를 맞춤
  const spec = PERSON_MODELS[model];
  const { outfit, skin, hair } = colors;
  const { object, scale } = useMemo(() => {
    const byName: Record<string, string | undefined> = {
      [spec.outfit]: outfit, [spec.skin]: skin, [spec.hair]: hair,
    };
    const obj = cloneSkinned(scene) as THREE.Object3D;
    obj.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.frustumCulled = false; // 스키닝 메시는 경계 상자가 정확하지 않아 잘려 보이는 것 방지
      const recolor = (m: THREE.Material) => {
        const c = m.clone() as THREE.MeshStandardMaterial;
        const color = byName[c.name];
        if (color) c.color.set(color);
        return c;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(recolor) : recolor(mesh.material);
    });
    const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
    return { object: obj, scale: size.y > 0 ? TARGET_HEIGHT / size.y : 1 };
  }, [scene, spec, outfit, skin, hair]);

  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    const a = actions[CLIP[action]];
    if (!a) return;
    a.reset().fadeIn(0.25).play();
    // 여러 명이 똑같이 움직이지 않도록 시작 시점을 조금씩 어긋나게
    a.time = (phase % 1) * a.getClip().duration;
    return () => { a.fadeOut(0.25); };
  }, [actions, action, phase]);

  return (
    <group ref={group} scale={scale}>
      <primitive object={object} />
    </group>
  );
}

/* 모델 파일을 못 불러오면 기존 캐릭터로 대체 (게임이 멈추지 않게) */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err: unknown) { console.warn("[GltfPerson] 모델 로드 실패, 기본 캐릭터 사용", err); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export function GltfPerson(props: {
  model: PersonModelId; action: PersonAction; colors: PersonColors; phase?: number; fallback: ReactNode;
}) {
  const { fallback, ...rest } = props;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfPersonInner {...rest} />
      </Suspense>
    </ModelBoundary>
  );
}

// 캠퍼스가 열리기 전에 미리 받아 두기
Object.values(PERSON_MODELS).forEach((m) => useGLTF.preload(m.url, false, true));
