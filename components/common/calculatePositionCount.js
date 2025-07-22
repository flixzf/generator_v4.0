// Helper function for calculating position counts
export function calculatePositionCount(position, config, getProcessGroups) {
  if (position === "MGL") return 1;
  if (position === "LM") return config.lineCount;
  
  // 모델 기반 인원 계산
  let total = 0;
  
  try {
    // 'display' 컨텍스트를 명시적으로 전달하여 병합된 구조를 사용
    const result = getProcessGroups(config);
    if (!result || !result.mainProcesses) return total;
    
    const groups = result.mainProcesses || [];
    const separatedProcesses = result.separatedProcesses || [];
    
    // 메인 공정들의 인원 계산
    groups.forEach((group) => {
      // 병합된 Stockfit-Assembly 노드 처리
      const isStockfitAssembly = group.gl?.subtitle?.includes('Stockfit-Assembly');
      
      if (position === "GL") {
        // 병합된 노드는 하나의 GL로 계산
        total += group.gl?.count || 1;
      } else if (position === "TL") {
        // TL은 그룹 내 모든 TL 포함 (병합된 구조에서도 모든 TL 카운트)
        total += group.tlGroup?.length || 0;
      } else if (position === "TM") {
        // TM은 그룹 내 모든 TM 포함
        if (isStockfitAssembly && group.sourceProcesses) {
          // 병합된 노드의 경우 실제 인원수 계산
          const stockfitManpower = group.sourceProcesses.stockfit?.reduce(
            (sum, p) => sum + (p.manAsy || 0), 0
          ) || 0;
          const assemblyManpower = group.sourceProcesses.assembly?.reduce(
            (sum, p) => sum + (p.manAsy || 0), 0
          ) || 0;
          // TM 그룹의 개수가 아닌 실제 인원수 합산
          total += stockfitManpower + assemblyManpower;
        } else {
          // 일반 노드는 TM 그룹 개수로 계산
          total += group.tmGroup?.length || 0;
        }
      }
    });
    
    // 분리된 공정들(No-sew/HF Welding)의 인원 계산
    if (separatedProcesses && separatedProcesses.length > 0) {
      separatedProcesses.forEach((group) => {
        if (position === "GL") {
          total += group.gl?.count || 1;
        } else if (position === "TL") {
          total += group.tlGroup?.length || 0;
        } else if (position === "TM") {
          total += group.tmGroup?.length || 0;
        }
      });
    }
  } catch (error) {
    console.error("Error calculating position count:", error);
  }
  
  return total;
}