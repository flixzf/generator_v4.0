"use client";
import React, { useState } from "react";
import { useOrgChart } from "@/context/OrgChartContext";

type ProcessData = {
  name: string;
  manStt: number;
  manAsy: number;
  miniLine: number;
  shift: number;
};

type ModelData = {
  category: string;
  modelName: string;
  styleNo: string;
  processes: ProcessData[];
};

export default function Page5() {
  const { models, addModel, updateModel, removeModel } = useOrgChart();
  const [selectedModelIndex, setSelectedModelIndex] = useState<number>(0);
  const [newModel, setNewModel] = useState<ModelData>({
    category: "",
    modelName: "",
    styleNo: "",
    processes: []
  });

  // 새 공정 추가
  const addProcess = (modelIndex: number) => {
    const model = models[modelIndex];
    const newProcess: ProcessData = {
      name: "",
      manStt: 0,
      manAsy: 0,
      miniLine: 1,
      shift: 1
    };
    
    const updatedModel = {
      ...model,
      processes: [...model.processes, newProcess]
    };
    
    updateModel(modelIndex, updatedModel);
  };

  // 공정 삭제
  const removeProcess = (modelIndex: number, processIndex: number) => {
    const model = models[modelIndex];
    const updatedModel = {
      ...model,
      processes: model.processes.filter((_, index) => index !== processIndex)
    };
    
    updateModel(modelIndex, updatedModel);
  };

  // 공정 업데이트
  const updateProcess = (modelIndex: number, processIndex: number, field: keyof ProcessData, value: string | number) => {
    const model = models[modelIndex];
    const updatedModel = {
      ...model,
      processes: model.processes.map((process, index) => 
        index === processIndex ? { ...process, [field]: value } : process
      )
    };
    
    updateModel(modelIndex, updatedModel);
  };

  // 모델 기본 정보 업데이트
  const updateModelInfo = (modelIndex: number, field: keyof ModelData, value: string) => {
    const model = models[modelIndex];
    const updatedModel = {
      ...model,
      [field]: value
    };
    
    updateModel(modelIndex, updatedModel);
  };

  // 새 모델 추가
  const handleAddModel = () => {
    if (newModel.category && newModel.modelName && newModel.styleNo) {
      addModel(newModel);
      setNewModel({
        category: "",
        modelName: "",
        styleNo: "",
        processes: []
      });
    }
  };

  // 모델별 총 인원수 계산
  const calculateModelTotal = (model: ModelData) => {
    return model.processes.reduce((total, process) => total + process.manAsy, 0);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">모델별 인원 설정</h1>
        
        {/* 모델 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            모델 선택
          </label>
          <select
            value={selectedModelIndex}
            onChange={(e) => setSelectedModelIndex(parseInt(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {models.map((model, index) => (
              <option key={index} value={index}>
                {model.category} - {model.modelName} ({model.styleNo})
              </option>
            ))}
          </select>
        </div>

        {/* 선택된 모델 정보 */}
        {models[selectedModelIndex] && (
          <div className="space-y-6">
            {/* 모델 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <input
                  type="text"
                  value={models[selectedModelIndex].category}
                  onChange={(e) => updateModelInfo(selectedModelIndex, 'category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  모델명
                </label>
                <input
                  type="text"
                  value={models[selectedModelIndex].modelName}
                  onChange={(e) => updateModelInfo(selectedModelIndex, 'modelName', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스타일 번호
                </label>
                <input
                  type="text"
                  value={models[selectedModelIndex].styleNo}
                  onChange={(e) => updateModelInfo(selectedModelIndex, 'styleNo', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 공정별 인원 설정 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">공정별 인원 설정</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => addProcess(selectedModelIndex)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    공정 추가
                  </button>
                  <button
                    onClick={() => removeModel(selectedModelIndex)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    disabled={models.length <= 1}
                  >
                    모델 삭제
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-3 text-left">공정명</th>
                      <th className="border border-gray-300 p-3 text-center">Man Stt</th>
                      <th className="border border-gray-300 p-3 text-center">Man Asy</th>
                      <th className="border border-gray-300 p-3 text-center">Mini Line</th>
                      <th className="border border-gray-300 p-3 text-center">Shift</th>
                      <th className="border border-gray-300 p-3 text-center">액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models[selectedModelIndex].processes.map((process, processIndex) => (
                      <tr key={processIndex} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={process.name}
                            onChange={(e) => updateProcess(selectedModelIndex, processIndex, 'name', e.target.value)}
                            className="w-full p-1 border border-gray-200 rounded"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            value={process.manStt}
                            onChange={(e) => updateProcess(selectedModelIndex, processIndex, 'manStt', parseFloat(e.target.value) || 0)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            step="0.1"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            value={process.manAsy}
                            onChange={(e) => updateProcess(selectedModelIndex, processIndex, 'manAsy', parseFloat(e.target.value) || 0)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            step="0.1"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            value={process.miniLine}
                            onChange={(e) => updateProcess(selectedModelIndex, processIndex, 'miniLine', parseInt(e.target.value) || 1)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            min="1"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="number"
                            value={process.shift}
                            onChange={(e) => updateProcess(selectedModelIndex, processIndex, 'shift', parseInt(e.target.value) || 1)}
                            className="w-full p-1 border border-gray-200 rounded text-center"
                            min="1"
                          />
                        </td>
                        <td className="border border-gray-300 p-2 text-center">
                          <button
                            onClick={() => removeProcess(selectedModelIndex, processIndex)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-bold">
                      <td className="border border-gray-300 p-3">총합</td>
                      <td className="border border-gray-300 p-3 text-center">
                        {models[selectedModelIndex].processes.reduce((sum, p) => sum + p.manStt, 0).toFixed(1)}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        {calculateModelTotal(models[selectedModelIndex])}
                      </td>
                      <td className="border border-gray-300 p-3"></td>
                      <td className="border border-gray-300 p-3"></td>
                      <td className="border border-gray-300 p-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 새 모델 추가 섹션 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">새 모델 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="카테고리"
              value={newModel.category}
              onChange={(e) => setNewModel({ ...newModel, category: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="모델명"
              value={newModel.modelName}
              onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <input
              type="text"
              placeholder="스타일 번호"
              value={newModel.styleNo}
              onChange={(e) => setNewModel({ ...newModel, styleNo: e.target.value })}
              className="p-2 border border-gray-300 rounded"
            />
            <button
              onClick={handleAddModel}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              disabled={!newModel.category || !newModel.modelName || !newModel.styleNo}
            >
              모델 추가
            </button>
          </div>
        </div>

        {/* 모델 요약 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">모델 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  index === selectedModelIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedModelIndex(index)}
              >
                <div className="font-semibold text-gray-800">
                  {model.category} - {model.modelName}
                </div>
                <div className="text-sm text-gray-600">{model.styleNo}</div>
                <div className="text-sm text-gray-600 mt-2">
                  공정 수: {model.processes.length}개
                </div>
                <div className="text-sm font-medium text-blue-600">
                  총 인원: {calculateModelTotal(model)}명
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 