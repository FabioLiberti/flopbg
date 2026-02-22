// src/components/ExperimentConfig/BasicConfigForm.js
const BasicConfigForm = ({ experimentConfig, setExperimentConfig }) => {
    const handleInputChange = (field, value) => {
      setExperimentConfig(field, value);
    };

    const inputStyle = {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: 'white',
      transition: 'all 0.2s ease',
      ':hover': {
        borderColor: '#3498db'
      }
    };

    const parameterBoxStyle = {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #ddd'
    };

    const labelStyle = {
      display: 'block',
      marginBottom: '8px',
      color: '#2c3e50',
      fontWeight: '500'
    };

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
      }}>
        {/* Algorithm */}
        <div style={{ ...parameterBoxStyle, backgroundColor: '#fff0f0', border: '1px solid #e0c0c0' }}>
          <label style={labelStyle}>
            Algorithm
          </label>
          <select
            value={experimentConfig.algorithm}
            onChange={(e) => handleInputChange('algorithm', e.target.value)}
            style={inputStyle}
          >
            <option value="fedavg">FedAvg</option>
            <option value="fedprox">FedProx</option>
            <option value="scaffold">SCAFFOLD</option>
            <option value="fednova">FedNova</option>
            <option value="fedexp">FedExP</option>
            <option value="feddyn">FedDyn</option>
            <option value="moon">MOON</option>
            <option value="feddisco">FedDisco</option>
            <option value="fedspeed">FedSpeed</option>
            <option value="fedlpa">FedLPA</option>
            <option value="deepafl">DeepAFL</option>
            <option value="fedel">FedEL</option>
          </select>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            {experimentConfig.algorithm === 'fedavg' && 'Federated Averaging — weighted average by sample count'}
            {experimentConfig.algorithm === 'fedprox' && 'FedAvg + proximal term in local training (requires Mu)'}
            {experimentConfig.algorithm === 'scaffold' && 'Variance reduction with control variates'}
            {experimentConfig.algorithm === 'fednova' && 'Normalized averaging by local gradient steps'}
            {experimentConfig.algorithm === 'fedexp' && 'Extrapolation — adaptive server step size from pseudo-gradient agreement'}
            {experimentConfig.algorithm === 'feddyn' && 'Dynamic Regularization — aligns local and global optima (requires Alpha)'}
            {experimentConfig.algorithm === 'moon' && 'Model-Contrastive Learning — corrects local drift with contrastive loss (requires Mu)'}
            {experimentConfig.algorithm === 'feddisco' && 'Distribution Discrepancy — aggregation weights based on local distribution divergence'}
            {experimentConfig.algorithm === 'fedspeed' && 'Proximal + gradient perturbation — corrects proximal term bias (requires Mu)'}
            {experimentConfig.algorithm === 'fedlpa' && 'Layer-wise Posterior Aggregation — Bayesian layer-by-layer aggregation'}
            {experimentConfig.algorithm === 'deepafl' && 'Analytic FL — gradient-free least squares on classifier layer'}
            {experimentConfig.algorithm === 'fedel' && 'Elastic Learning — dynamic tensor selection per round (requires Budget)'}
          </div>
        </div>

        {/* Number of Rounds */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Number of Rounds
          </label>
          <input
            type="number"
            value={experimentConfig.numRounds}
            onChange={(e) => handleInputChange('numRounds', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>

        {/* Number of Clients */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Number of Clients
          </label>
          <input
            type="number"
            value={experimentConfig.numClients}
            onChange={(e) => handleInputChange('numClients', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
            Synced with Node Configuration
          </div>
        </div>

        {/* Local Epochs */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Local Epochs
          </label>
          <input
            type="number"
            value={experimentConfig.localEpochs}
            onChange={(e) => handleInputChange('localEpochs', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>

        {/* Batch Size */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Batch Size
          </label>
          <input
            type="number"
            value={experimentConfig.batchSize}
            onChange={(e) => handleInputChange('batchSize', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>

        {/* Learning Rate */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Learning Rate
          </label>
          <input
            type="number"
            value={experimentConfig.learningRate}
            onChange={(e) => handleInputChange('learningRate', parseFloat(e.target.value))}
            style={inputStyle}
            step="0.001"
            min="0"
          />
        </div>

        {/* Mu/Alpha/Budget - visible for algorithms that need a scalar parameter */}
        {['fedprox', 'feddyn', 'moon', 'fedspeed', 'fedel'].includes(experimentConfig.algorithm) && (
          <div style={parameterBoxStyle}>
            <label style={labelStyle}>
              {experimentConfig.algorithm === 'fedprox' && 'Mu (Proximal Term)'}
              {experimentConfig.algorithm === 'feddyn' && 'Alpha (Dynamic Regularization)'}
              {experimentConfig.algorithm === 'moon' && 'Mu (Contrastive Weight)'}
              {experimentConfig.algorithm === 'fedspeed' && 'Mu (Proximal Term)'}
              {experimentConfig.algorithm === 'fedel' && 'Budget Fraction'}
            </label>
            <input
              type="number"
              value={experimentConfig.mu}
              onChange={(e) => handleInputChange('mu', parseFloat(e.target.value))}
              style={inputStyle}
              step={experimentConfig.algorithm === 'fedel' ? '0.1' : '0.01'}
              min="0"
              max={experimentConfig.algorithm === 'fedel' ? '1' : undefined}
            />
            <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
              {experimentConfig.algorithm === 'fedprox' && 'Controls proximity to global model (0 = FedAvg)'}
              {experimentConfig.algorithm === 'feddyn' && 'Controls alignment of local and global optima'}
              {experimentConfig.algorithm === 'moon' && 'Weight of contrastive loss (0 = FedAvg)'}
              {experimentConfig.algorithm === 'fedspeed' && 'Proximal coefficient with gradient correction'}
              {experimentConfig.algorithm === 'fedel' && 'Fraction of layers to communicate (0.1\u20131.0)'}
            </div>
          </div>
        )}

        {/* Quantization Bits */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Quantization Bits
          </label>
          <input
            type="number"
            value={experimentConfig.quantizationBits}
            onChange={(e) => handleInputChange('quantizationBits', parseInt(e.target.value))}
            style={inputStyle}
            min="1"
          />
        </div>

        {/* Global Participation Rate */}
        <div style={parameterBoxStyle}>
          <label style={labelStyle}>
            Global Participation Rate
          </label>
          <input
            type="number"
            value={experimentConfig.globalParticipationRate}
            onChange={(e) => handleInputChange('globalParticipationRate', parseFloat(e.target.value))}
            style={inputStyle}
            step="0.1"
            min="0"
            max="1"
          />
        </div>
      </div>
    );
  };

  export default BasicConfigForm;
