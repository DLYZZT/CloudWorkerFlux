/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Flux Image Generator - Cloudflare Worker
 * 
 * 这个应用使用 Replicate API 的 Flux 模型来根据用户提示词生成图像
 */


// HTML 模板
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flux 图像生成器</title>
  <style>
    :root {
      --primary-color: #6366f1;
      --primary-hover: #4f46e5;
      --bg-color: #f9fafb;
      --card-bg: #ffffff;
      --text-color: #1f2937;
      --border-color: #e5e7eb;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      margin: 0;
      padding: 0;
      line-height: 1.5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    h2 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      color: var(--primary-color);
    }
    
    p.subtitle {
      font-size: 1.1rem;
      color: #6b7280;
      margin-top: 0;
    }
    
    .app-container {
      display: flex;
      flex-direction: row;
      gap: 2rem;
      margin-top: in 2rem;
    }
    
    @media (max-width: 768px) {
      .app-container {
        flex-direction: column-reverse;
      }
    }
    
    .image-section {
      flex: 1;
      background: var(--card-bg);
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }
    
    .image-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    
    .generated-image {
      max-width: 100%;
      max-height: 500px;
      border-radius: 0.5rem;
      display: none;
    }
    
    .placeholder {
      text-align: center;
      color: #9ca3af;
      font-size: 1.1rem;
    }
    
    .controls-section {
      flex: 1;
      background: var(--card-bg);
      border-radius: 0.75rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      padding: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 1.5rem;
    }
    
    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    
    input[type="text"],
    textarea,
    select {
      width: 90%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 0.375rem;
      font-size: 1rem;
      background-color: #fff;
      transition: border-color 0.15s ease-in-out;
    }
    
    input[type="text"]:focus,
    textarea:focus,
    select:focus {
      border-color: var(--primary-color);
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
    
    textarea {
      min-height: 120px;
      resize: vertical;
    }
    
    button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 0.375rem;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease-in-out;
      width: 100%;
    }
    
    button:hover {
      background-color: var(--primary-hover);
    }
    
    button:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
    
    .loading {
      display: none;
      text-align: center;
    }
    
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-left-color: var(--primary-color);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 2rem auto;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    .error-message {
      color: #ef4444;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      display: none;
    }
    
    .download-btn {
      margin-top: 1rem;
      background-color: transparent;
      color: var(--primary-color);
      border: 1px solid var(--primary-color);
      display: none;
    }
    
    .download-btn:hover {
      background-color: rgba(99, 102, 241, 0.1);
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h2>Flux 图像生成器</h2>
    </header>
    
    <div class="app-container">
      <div class="image-section">
        <div class="image-container">
          <div class="placeholder">您生成的图像将显示在这里</div>
          <img id="generated-image" class="generated-image" alt="生成的图像">
          <div id="loading" class="loading">
            <div class="spinner"></div>
            <p>正在生成图像，请稍候...</p>
          </div>
        </div>
        <button id="download-btn" class="download-btn">下载图像</button>
      </div>
      
      <div class="controls-section">
        <form id="generate-form">
          <div class="form-group">
            <label for="prompt">提示词</label>
            <textarea id="prompt" name="prompt" required placeholder="描述您想要生成的图像，例如：'一只可爱的猫咪在阳光明媚的花园里玩耍'"></textarea>
          </div>
          
          <div class="form-group">
            <label for="size">图像比例</label>
            <select id="size" name="size">
              <option value="1:1">1:1</option>
              <option value="16:9">16:9</option>
              <option value="21:9">21:9</option>
              <option value="9:16">9:16</option>
              <option value="9:21">9:21</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="api_key">Replicate API KEY</label>
            <input type="text" id="api_key" name=api_key" placeholder="KEY">
          </div>
          
          <div id="error-message" class="error-message"></div>
          
          <button type="submit" id="generate-btn">生成图像</button>
        </form>
      </div>
    </div>
  </div>
  
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('generate-form');
      const generateBtn = document.getElementById('generate-btn');
      const loadingDiv = document.getElementById('loading');
      const placeholderDiv = document.querySelector('.placeholder');
      const generatedImage = document.getElementById('generated-image');
      const downloadBtn = document.getElementById('download-btn');
      const errorMessage = document.getElementById('error-message');
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 隐藏之前的错误信息
        errorMessage.style.display = 'none';
        
        // 获取表单数据
        const prompt = document.getElementById('prompt').value;
        const size = document.getElementById('size').value;
        const api_key = document.getElementById('api_key').value;

		if (!api_key) {
			errorMessage.textContent = '请输入API KEY';
			errorMessage.style.display = 'block';
			return;
		}
        
        if (!prompt) {
          errorMessage.textContent = '请输入提示词';
          errorMessage.style.display = 'block';
          return;
        }
        
        // 显示加载状态
        generateBtn.disabled = true;
        placeholderDiv.style.display = 'none';
        generatedImage.style.display = 'none';
        downloadBtn.style.display = 'none';
        loadingDiv.style.display = 'block';
        
        try {
          // 调用API生成图像
          const response = await fetch('/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt,
              size,
              api_key
            }),
          });
          
          if (!response.ok) {
            throw new Error('图像生成失败');
          }
          
          const data = await response.json();
          
          // 显示生成的图像
          generatedImage.src = data.image_url;
          generatedImage.style.display = 'block';
          downloadBtn.style.display = 'block';
          
          // 设置下载按钮
          downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = data.image_url;
            a.download = 'flux-generated-image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };
        } catch (error) {
          errorMessage.textContent = error.message || '生成图像时出错，请重试';
          errorMessage.style.display = 'block';
          placeholderDiv.style.display = 'block';
        } finally {
          // 隐藏加载状态
          loadingDiv.style.display = 'none';
          generateBtn.disabled = false;
        }
      });
    });
  </script>
</body>
</html>`;

export default {
	async fetch(request, env, ctx) {

		const url = new URL(request.url);
		
		// 处理根路径请求，返回HTML页面
		if (url.pathname === '/' && request.method === 'GET') {
			return new Response(html, {
				headers: {
					'Content-Type': 'text/html;charset=UTF-8',
				},
			});
		}
		
		// 处理图像生成API请求
		if (url.pathname === '/generate' && request.method === 'POST') {

			try {
				const requestData = await request.json();
				const { prompt, size, api_key } = requestData;

				if (!api_key) {
					return new Response(
						JSON.stringify({ error: '请提供API KEY' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}

				if (!prompt) {
					return new Response(
						JSON.stringify({ error: '请提供提示词' }),
						{
							status: 400,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				// 调用Replicate API
				const replicateResponse = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${api_key}`,
					},
					body: JSON.stringify({
						// "version": "34356fbf41d24cb5aa32efd9fdfab9b688e4ad38e93bbf6e13b7ef548d7ab44a",
						"input": {
						  "prompt": prompt,
						  "aspect_ratio": size,
						  "output_format": "png",
						  "guidance_scale": 3.5,
						  "output_quality": 100
						}
					}),
				});

				if (!replicateResponse.ok) {
					const errorData = await replicateResponse.json();
					console.error('Replicate API error:', errorData);
					return new Response(
						JSON.stringify({ error: '调用Replicate API失败' }),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				const replicateData = await replicateResponse.json();
				
				// 轮询Replicate API获取结果
				let resultData;
				let attempts = 0;
				const maxAttempts = 60; // 最多等待60次，每次等待1秒
				
				while (!resultData && attempts < maxAttempts) {
					await new Promise(resolve => setTimeout(resolve, 1000));
					
					const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${replicateData.id}`, {
						headers: {
							'Authorization': `Bearer ${api_key}`,
							'Content-Type': 'application/json',
						},
					});
					
					if (statusResponse.ok) {
						const statusData = await statusResponse.json();
						
						if (statusData.status === 'succeeded') {
							resultData = statusData;
							break;
						} else if (statusData.status === 'failed') {
							return new Response(
								JSON.stringify({ error: '图像生成失败' }),
								{
									status: 500,
									headers: { 'Content-Type': 'application/json' },
								}
							);
						}
					}
					
					attempts++;
				}
				
				if (!resultData) {
					return new Response(
						JSON.stringify({ error: '生成图像超时' }),
						{
							status: 500,
							headers: { 'Content-Type': 'application/json' },
						}
					);
				}
				
				// 返回生成的图像URL
				return new Response(
					JSON.stringify({ image_url: resultData.output }),
					{
						headers: { 'Content-Type': 'application/json' },
					}
				);
			} catch (error) {
				console.error('Error generating image:', error);
				return new Response(
					JSON.stringify({ error: '生成图像时发生错误' }),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' },
					}
				);
			}
		}
		
		// 处理其他请求
		return new Response('Not Found', { status: 404 });
	},
};
