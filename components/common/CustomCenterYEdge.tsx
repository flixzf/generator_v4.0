import React, { memo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, Position } from 'reactflow';

type AnyEdgeProps = EdgeProps<any> & { pathOptions?: any; data?: any };

const CustomCenterYEdge: React.FC<AnyEdgeProps> = (props) => {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    markerEnd,
    markerStart,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    interactionWidth,
    pathOptions,
    data,
  } = props as AnyEdgeProps;

  // centerY 결정 우선순위:
  // 1) data.centerOffset: sourceY 기준으로 target 방향으로 고정 오프셋만큼 이동
  // 2) data.centerToLevelY: sourceY와 해당 레벨Y의 중간값
  // 3) pathOptions.centerY 또는 data.centerY 지정값
  // 4) 기본: sourceY와 targetY의 중간값
  let centerY: number | undefined = undefined;
  if (typeof data?.centerOffset === 'number') {
    const direction = targetY >= sourceY ? 1 : -1;
    centerY = sourceY + direction * Math.abs(data.centerOffset as number);
  } else if (typeof (data?.centerToLevelY) === 'number') {
    centerY = (sourceY + (data.centerToLevelY as number)) / 2;
  } else if ((pathOptions && pathOptions.centerY) ?? (data && data.centerY)) {
    centerY = (pathOptions && pathOptions.centerY) ?? (data && data.centerY);
  } else {
    centerY = (sourceY + targetY) / 2;
  }
  const centerX: number | undefined = (pathOptions && pathOptions.centerX) ?? (data && data.centerX);
  const borderRadius: number | undefined = pathOptions?.borderRadius;
  const offset: number | undefined = pathOptions?.offset;

  // 모든 경우에 단일 꺾임의 직교 경로를 강제한다.
  // 이유: getSmoothStepPath는 centerY가 source/target 사이에 있을 때 S자 보정이 발생할 수 있음.
  const bendY = centerY ?? (sourceY + targetY) / 2;
  const path = `M ${sourceX},${sourceY} L ${sourceX},${bendY} L ${targetX},${bendY} L ${targetX},${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      style={style}
      markerEnd={markerEnd}
      markerStart={markerStart}
      interactionWidth={interactionWidth}
    />
  );
};

export default memo(CustomCenterYEdge);


