import React from 'react';

interface ProgressBarProps {
  progress: number;
  isVisible: boolean;
  operationType: 'upload' | 'delete';
  fileName?: string;
  message?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  isVisible,
  operationType,
  fileName,
  message
}) => {
  const operationText = operationType === 'upload' ? 'Uploading' : 'Deleting';
  const icon = operationType === 'upload' ? '⬆️' : '🗑️';
  const progressColor = operationType === 'upload' ? '#007bff' : '#dc3545';

  if (!isVisible) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-container">
        <div className="progress-header">
          <span className="progress-icon">{icon}</span>
          <span className="progress-text">
            {message || `${operationText} ${fileName ? fileName : 'items'}...`}
          </span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progress}%`,
              backgroundColor: progressColor,
              transition: 'width 0.3s ease-in-out'
            }}
          ></div>
        </div>
        <div className="progress-percentage">{Math.round(progress)}%</div>
      </div>
    </div>
  );
};

export default ProgressBar;