---
title: Linux Ollama版
desc: MemCube是MemOS的核心组件，它就像赛博朋克2077中的“记忆芯片”，可以让agent加载不同的“记忆包”来获得不同的知识和能力。在这一章中，我们将通过三个渐进式的配方，帮你掌握MemCube的基础操作。<br />注意，MemOS系统分为两个层级：OS层级和Cube层级，这里先介绍的是更为基础的Cube层级。下面的很多操作，例如add和search操作，OS层级也具有，其区别为：OS管理了多个Cube，可以对多个Cube进行整体的搜索和操作，而Cube仅负责自身的写入和查询。
---

## 第一章：入门：你的第一个 MemCube (Linux Ollama版)

MemCube是MemOS的核心组件，它就像赛博朋克2077中的“记忆芯片”，可以让agent加载不同的“记忆包”来获得不同的知识和能力。在这一章中，我们将通过三个渐进式的配方，帮你掌握MemCube的基础操作。

注意，MemOS系统分为两个层级：OS层级和Cube层级，这里先介绍的是更为基础的Cube层级。下面的很多操作，例如add和search操作，OS层级也具有，其区别为：OS管理了多个Cube，可以对多个Cube进行整体的搜索和操作，而Cube仅负责自身的写入和查询。

### 配方 1.1：安装和配置你的 MemOS 开发环境 (Ollama版)

**🎯 问题场景：** 你是一名AI应用开发者，想要尝试最新最火的MemOS，但不知道如何配置MemOS环境。

**🔧 解决方案：** 通过这个配方，你将学会如何从零开始建立一个完整的MemOS环境。

#### 步骤1：检查系统要求

```bash
# 检查Python版本（需要3.10+）
python --version

# 💡 如果版本低于3.10，请先升级Python
```

#### 步骤2：安装MemOS

**方案A：生产环境安装（推荐）**

```bash
# 🎯 快速安装，适合生产使用
pip install MemoryOS chonkie qdrant_client markitdown
```

**方案B：开发环境安装（适合贡献者）**

```bash
# 🎯 克隆源码并安装开发环境
git clone https://github.com/MemTensor/MemOS.git
cd MemOS

# 🎯 使用make安装（会自动处理依赖和虚拟环境）
make install

# 🎯 激活Poetry虚拟环境
poetry shell
# 或者使用：poetry run python your_script.py
```

#### 步骤3：配置Ollama本地模型环境变量

如果您还没有安装Ollama，请先安装：

```bash
# 🎯 安装Ollama本地模型服务
curl -fsSL https://ollama.com/install.sh | sh

# 启动Ollama服务（默认端口）
ollama serve 
# 启动Ollama服务（指定端口）
# OLLAMA_HOST="localhost:11434" ollama serve

# 下载推荐的模型
ollama pull nomic-embed-text:latest  # 嵌入模型
ollama pull qwen2.5:0.5b             # 聊天模型
```

创建 `.env` 文件：

```bash
# .env
# 🎯 Ollama本地模型配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:0.5b
OLLAMA_EMBED_MODEL=nomic-embed-text:latest

# 🎯 MemOS特定配置
MOS_TEXT_MEM_TYPE=general_text
MOS_USER_ID=default_user
MOS_TOP_K=5
```

#### 步骤4：验证安装和完整环境

创建验证文件 `test_memos_setup_ollama_mode.py`：

```python
# test_memos_setup_ollama_mode.py
# 🎯 Ollama模式验证脚本 - 使用本地Ollama模型和手动配置
import os
import sys
from dotenv import load_dotenv

def check_ollama_environment():
    """🎯 检查Ollama环境变量配置"""
    print("🔍 检查Ollama环境变量配置...")
    
    # 加载.env文件
    load_dotenv()
    
    # 检查Ollama配置
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    print(f"📋 Ollama环境变量状态:")
    
    if ollama_base_url:
        print(f"  ✅ OLLAMA_BASE_URL: {ollama_base_url}")
        print(f"  ✅ OLLAMA_CHAT_MODEL: {ollama_chat_model or '❌ 未配置'}")
        print(f"  ✅ OLLAMA_EMBED_MODEL: {ollama_embed_model or '❌ 未配置'}")
        ollama_configured = bool(ollama_base_url and ollama_chat_model and ollama_embed_model)
        
        if ollama_configured:
            print("✅ Ollama配置完整")
        else:
            print("❌ Ollama配置不完整")
        
        return ollama_configured
    else:
        print(f"  ❌ OLLAMA_BASE_URL: 未配置")
        print(f"  ❌ OLLAMA_CHAT_MODEL: 未配置")
        print(f"  ❌ OLLAMA_EMBED_MODEL: 未配置")
        return False

def check_memos_installation():
    """🎯 检查MemOS安装状态"""
    print("\n🔍 检查MemOS安装状态...")
    
    try:
        import memos
        print(f"✅ MemOS版本: {memos.__version__}")
        
        # 测试核心组件导入
        from memos.mem_cube.general import GeneralMemCube
        from memos.mem_os.main import MOS
        from memos.configs.mem_os import MOSConfig
        from memos.configs.mem_cube import GeneralMemCubeConfig
        
        print("✅ 核心组件导入成功")
        return True
        
    except ImportError as e:
        print(f"❌ 导入失败: {e}")
        return False
    except Exception as e:
        print(f"❌ 其他错误: {e}")
        return False

def test_ollama_functionality():
    """🎯 测试Ollama模式功能"""
    print("\n🔍 测试Ollama模式功能...")
    
    try:
        from memos.mem_os.main import MOS
        from memos.configs.mem_os import MOSConfig
        from memos.configs.mem_cube import GeneralMemCubeConfig
        from memos.mem_cube.general import GeneralMemCube
        
        # 获取环境变量
        ollama_base_url = os.getenv("OLLAMA_BASE_URL")
        ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
        ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
        
        print("🚀 创建Ollama配置...")
        
        # 创建MOS配置
        mos_config = MOSConfig(
            user_id=os.getenv("MOS_USER_ID", "default_user"),
            chat_model={
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_chat_model,
                    "api_base": ollama_base_url,
                    "temperature": 0.7,
                    "max_tokens": 1024,
                }
            },
            mem_reader={
                "backend": "simple_struct",
                "config": {
                    "llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "chunker": {
                        "backend": "sentence",
                        "config": {
                            "tokenizer_or_token_counter": "gpt2",
                            "chunk_size": 512,
                            "chunk_overlap": 128,
                            "min_sentences_per_chunk": 1,
                        }
                    }
                }
            },
            enable_textual_memory=True,
            top_k=int(os.getenv("MOS_TOP_K", "5"))
        )
        
        # 创建MemCube配置
        cube_config = GeneralMemCubeConfig(
            user_id=os.getenv("MOS_USER_ID", "default_user"),
            cube_id=f"{os.getenv('MOS_USER_ID', 'default_user')}_cube",
            text_mem={
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url,
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"{os.getenv('MOS_USER_ID', 'default_user')}_collection",
                            "vector_dimension": 768,  # nomic-embed-text的维度
                            "distance_metric": "cosine",
                        }
                    }
                }
            },
            act_mem={"backend": "uninitialized"},
            para_mem={"backend": "uninitialized"}
        )
        
        print("✅ 配置创建成功！")
        
        # 创建MOS实例和MemCube
        print("🚀 创建MOS实例和MemCube...")
        memory = MOS(mos_config)
        mem_cube = GeneralMemCube(cube_config)
        memory.register_mem_cube(mem_cube)
        
        print("✅ MOS实例和MemCube创建成功！")
        print(f"  📊 用户ID: {memory.user_id}")
        print(f"  📊 会话ID: {memory.session_id}")
        print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
        
        # 测试添加记忆
        print("\n🧠 测试添加记忆...")
        memory.add(memory_content="这是一个Ollama模式的测试记忆")
        print("✅ 记忆添加成功！")
        
        # 测试聊天功能
        print("\n💬 测试聊天功能...")
        response = memory.chat("我刚才添加了什么记忆？")
        print(f"✅ 聊天响应: {response}")
        
        # 测试搜索功能
        print("\n🔍 测试搜索功能...")
        search_results = memory.search("测试记忆", top_k=3)
        if search_results and search_results.get("text_mem"):
            print(f"✅ 搜索成功，找到 {len(search_results['text_mem'])} 个结果")
        else:
            print("⚠️ 搜索未返回结果")
        
        # 测试MemCube直接操作
        print("\n🔧 测试MemCube直接操作...")
        mem_cube.text_mem.add([{
            "memory": "这是通过MemCube直接添加的记忆",
            "metadata": {
                "source": "conversation",
                "type": "fact",
                "confidence": 0.9
            }
        }])
        print("✅ MemCube直接操作成功！")
        
        print("✅ Ollama模式功能测试成功！")
        return True
        
    except Exception as e:
        print(f"❌ Ollama模式功能测试失败: {e}")
        print("💡 提示：请检查Ollama服务是否运行，模型是否已下载。")
        return False

def main():
    """🎯 Ollama模式主验证流程"""
    print("🚀 开始MemOS Ollama模式环境验证...\n")
    
    # 步骤1: 检查Ollama环境变量
    env_ok = check_ollama_environment()
    
    # 步骤2: 检查安装状态
    install_ok = check_memos_installation()
    
    # 步骤3: 测试功能
    if env_ok and install_ok:
        func_ok = test_ollama_functionality()
    else:
        func_ok = False
        if not env_ok:
            print("\n⚠️ 由于Ollama环境变量配置不完整，跳过功能测试")
        elif not install_ok:
            print("\n⚠️ 由于MemOS安装失败，跳过功能测试")
    
    # 总结
    print("\n" + "="*50)
    print("📊 Ollama模式验证结果总结:")
    print(f"  Ollama环境变量: {'✅ 通过' if env_ok else '❌ 失败'}")
    print(f"  MemOS安装: {'✅ 通过' if install_ok else '❌ 失败'}")
    print(f"  功能测试: {'✅ 通过' if func_ok else '❌ 失败'}")
    
    if env_ok and install_ok and func_ok:
        print(f"\n🎉 恭喜！MemOS Ollama模式环境配置完全成功！")
        print(f"💡 你现在可以开始使用MemOS Ollama模式了。")
        print(f"💡 使用方式: 手动配置MOSConfig和GeneralMemCubeConfig")
    elif install_ok and env_ok:
        print(f"\n⚠️ MemOS已安装，Ollama已配置，但功能测试失败。")
        print(f"💡 请检查Ollama服务是否运行，模型是否已下载。")
    elif install_ok:
        print("\n⚠️ MemOS已安装，但需要配置Ollama环境变量才能正常使用。")
        print("💡 请在.env文件中配置OLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODEL。")
    else:
        print("\n❌ 环境配置存在问题，请检查上述错误信息。")
    
    return bool(env_ok and install_ok and func_ok)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
```

运行Ollama模式验证：

```bash
python test_memos_setup_ollama_mode.py
```

#### 常见问题和解决方案

**Q1: macOS安装失败怎么办？**

```bash
# 🔧 macOS可能需要额外配置
export SYSTEM_VERSION_COMPAT=1
pip install MemoryOS
```

**Q2: 依赖冲突怎么解决？**

```bash
# 🔧 使用虚拟环境隔离
python -m venv memos_env
source memos_env/bin/activate  # Linux/macOS
pip install MemoryOS
```

**Q3: GPU加速配置？（Ollama模式下）**

```bash
# 🔧 仅在使用Ollama本地模型时需要GPU加速
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 配方 1.2：从文档文件构建一个简单的 MemCube (Ollama版)

**🎯 问题场景：** 你有一个包含公司知识库的PDF文档，想要创建一个可以回答相关问题的“记忆芯片”。

**🔧 解决方案：** 通过这个配方，你将学会如何使用MemReader将文档转换为可搜索的MemCube。MemReader是MemOS的核心组件，能够智能地解析文档并提取结构化记忆。

#### 步骤1：准备示例文档

创建一个示例知识文档 `company_handbook.txt`：

```text
# 公司员工手册

## 工作时间
公司的标准工作时间是周一至周五，上午9:00至下午6:00。
弹性工作制允许员工在上午8:00-10:00之间开始工作。

## 休假政策
- 年假：每年15天带薪年假
- 病假：每年7天带薪病假
- 个人假：每年3天个人事务假

## 福利待遇
公司提供完善的五险一金，包括：
- 养老保险
- 医疗保险
- 失业保险
- 工伤保险
- 生育保险
- 住房公积金

额外福利包括年度体检、团建活动和培训补贴。

## 办公设备
每位员工将获得：
- 笔记本电脑一台
- 显示器一台
- 人体工学椅
- 办公桌

## 联系方式
HR部门：hr@company.com
IT支持：it@company.com
财务部门：finance@company.com
```

#### 步骤2：使用MemReader创建MemCube

**💡 Ollama模式：** 这个脚本使用本地Ollama模型进行文档处理和向量化。

**🔧 环境变量配置：** 在运行脚本之前，请确保已经按照配方1.1配置好Ollama环境变量。

对于其它解析器的使用方法，可以参考文档：TODO


```python
# create_memcube_with_memreader_ollama.py
# 🎯 使用MemReader创建MemCube的完整流程 (Ollama版)
import os
import uuid
from dotenv import load_dotenv
from memos.configs.mem_cube import GeneralMemCubeConfig
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_reader import MemReaderConfigFactory
from memos.mem_reader.factory import MemReaderFactory

def create_memcube_with_memreader():
    """
    🎯 使用MemReader创建MemCube的完整流程 (Ollama版)
    """
    
    print("🔧 创建MemCube配置...")
    
    # 加载环境变量
    load_dotenv()
    
    # 获取Ollama配置
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ 未配置Ollama环境变量。请在.env文件中配置OLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODEL。")
    
    print("✅ 检测到Ollama本地模型模式")
    
    # 获取MemOS配置
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    
    # Ollama模式配置
    cube_config = {
        "user_id": user_id,
        "cube_id": f"{user_id}_company_handbook_cube",
        "text_mem": {
            "backend": "general_text",
            "config": {
                "extractor_llm": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_chat_model,
                        "api_base": ollama_base_url
                    }
                },
                "embedder": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_embed_model,
                        "api_base": ollama_base_url
                    }
                },
                "vector_db": {
                    "backend": "qdrant",
                    "config": {
                        "collection_name": f"{user_id}_company_handbook",
                        "vector_dimension": 768,
                        "distance_metric": "cosine"
                    }
                }
            }
        },
        "act_mem": {"backend": "uninitialized"},
        "para_mem": {"backend": "uninitialized"}
    }
    
    # 创建MemCube实例
    config_obj = GeneralMemCubeConfig.model_validate(cube_config)
    mem_cube = GeneralMemCube(config_obj)
    
    print("✅ MemCube创建成功！")
    print(f"  📊 用户ID: {mem_cube.config.user_id}")
    print(f"  📊 MemCube ID: {mem_cube.config.cube_id}")
    print(f"  📊 文本记忆后端: {mem_cube.config.text_mem.backend}")
    print(f"  🔍 嵌入模型: {ollama_embed_model} (Ollama)")
    print(f"  🎯 配置模式: OLLAMA")
    
    return mem_cube

def create_memreader_config():
    """
    🎯 创建MemReader配置 (Ollama版)
    """
    
    # 加载环境变量
    load_dotenv()
    
    # 获取Ollama配置
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    # MemReader配置
    mem_reader_config = MemReaderConfigFactory(
        backend="simple_struct",
        config={
            "llm": {
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_chat_model,
                    "api_base": ollama_base_url
                }
            },
            "embedder": {
                "backend": "ollama",
                "config": {
                    "model_name_or_path": ollama_embed_model,
                    "api_base": ollama_base_url
                }
            },
            "chunker": {
                "backend": "sentence",
                "config": {
                    "chunk_size": 128,
                    "chunk_overlap": 32,
                    "min_sentences_per_chunk": 1
                }
            },
            "remove_prompt_example": False
        }
    )
    
    return mem_reader_config

def load_document_to_memcube(mem_cube, doc_path):
    """
    🎯 使用MemReader加载文档到MemCube (Ollama版)
    """
    
    print(f"\n📖 使用MemReader读取文档: {doc_path}")
    
    # 创建MemReader
    mem_reader_config = create_memreader_config()
    mem_reader = MemReaderFactory.from_config(mem_reader_config)
    
    # 准备文档数据
    print("📄 准备文档数据...")
    documents = [doc_path]  # MemReader期望的是文档路径列表
    
    # 使用MemReader处理文档
    print("🧠 使用MemReader提取记忆...")
    memories = mem_reader.get_memory(
        documents,
        type="doc",
        info={
            "user_id": mem_cube.config.user_id, 
            "session_id": str(uuid.uuid4())
        }
    )
    
    print(f"📚 MemReader生成了 {len(memories)} 个记忆片段")
    
    # 添加记忆到MemCube
    print("💾 添加记忆到MemCube...")
    for mem in memories:
        mem_cube.text_mem.add(mem)
        print(mem)
    
    print(f"✅ 成功添加 {len(memories)} 个记忆片段到MemCube")
    
    # 输出基本信息
    print("\n📊 MemCube基本信息:")
    print(f"  📁 文档来源: {doc_path}")
    print(f"  📝 记忆片段数量: {len(memories)}")
    print(f"  🏷️ 文档类型: company_handbook")
    print(f"  💾 向量数据库: Qdrant (内存模式，释放内存即删除)")
    print(f"  🔍 嵌入模型: {os.getenv('OLLAMA_EMBED_MODEL')} (Ollama)")
    print(f"  🎯 配置模式: OLLAMA")
    print(f"  🧠 记忆提取器: MemReader (simple_struct)")
    
    return mem_cube

if __name__ == "__main__":
    print("🚀 开始使用MemReader创建文档MemCube (Ollama版)...")
    
    # 创建MemCube
    mem_cube = create_memcube_with_memreader()
    
    # 加载文档
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
    print("\n🎉 MemCube创建完成！") 
```

#### 実行例

```bash
# 步骤2：创建MemCube
python create_memcube_with_memreader_ollama.py
```


#### 步骤3：测试搜索和对话功能

**💡 Ollama模式：** 这个脚本使用本地Ollama模型进行搜索和对话。

> 在当前MemOS版本中，未启用Scheduler的情况下，运行chat会出现一些问题，需要手动注释掉一段代码，按照如下步骤操作即可正常运行后续所有示例代码。之后的版本我们会修复这个问题。
> ctrl+左键 点击下方的chat()函数，然后点击super.chat()进入到core.py中，或在环境安装目录下，找到lib/python3.12/site-packages/memos/mem_os/core.py 搜索def chat定位到对应函数
> 注释掉函数最后return上方的代码块：

```
# submit message to scheduler
# for accessible_mem_cube in accessible_cubes:
#     mem_cube_id = accessible_mem_cube.cube_id
#     mem_cube = self.mem_cubes[mem_cube_id]
#     if self.enable_mem_scheduler and self.mem_scheduler is not None:
#         message_item = ScheduleMessageItem(
#             user_id=target_user_id,
#             mem_cube_id=mem_cube_id,
#             mem_cube=mem_cube,
#             label=ANSWER_LABEL,
#             content=response,
#             timestamp=datetime.now(),
#         )
#         self.mem_scheduler.submit_messages(messages=[message_item])
```

```python
# test_memcube_search_and_chat_ollama.py
# 🎯 测试MemCube的搜索和对话功能 (Ollama版)
import os
from dotenv import load_dotenv
from memos.configs.mem_os import MOSConfig
from memos.mem_os.main import MOS

def create_mos_config():
    """
    🎯 创建MOS配置 (Ollama版)
    """
    load_dotenv()
    
    user_id = os.getenv("MOS_USER_ID", "default_user")
    top_k = int(os.getenv("MOS_TOP_K", "5"))
    ollama_base_url = os.getenv("OLLAMA_BASE_URL")
    ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
    ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
    
    if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
        raise ValueError("❌ 未配置Ollama环境变量。请在.env文件中配置OLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODEL。")
    
    # Ollama模式配置
    return MOSConfig(
        user_id=user_id,
        chat_model={
            "backend": "ollama",
            "config": {
                "model_name_or_path": ollama_chat_model,
                "api_base": ollama_base_url,
                "temperature": 0.1,
                "max_tokens": 1024,
            }
        },
        mem_reader={
            "backend": "simple_struct",
            "config": {
                "llm": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_chat_model,
                        "api_base": ollama_base_url,
                    }
                },
                "embedder": {
                    "backend": "ollama",
                    "config": {
                        "model_name_or_path": ollama_embed_model,
                        "api_base": ollama_base_url,
                    }
                },
                "chunker": {
                    "backend": "sentence",
                    "config": {
                        "tokenizer_or_token_counter": "gpt2",
                        "chunk_size": 512,
                        "chunk_overlap": 128,
                        "min_sentences_per_chunk": 1,
                    }
                }
            }
        },
        enable_textual_memory=True,
        top_k=top_k
    )

def test_memcube_search_and_chat():
    """
    🎯 测试MemCube的搜索和对话功能 (Ollama版)
    """
    
    print("🚀 开始测试MemCube搜索和对话功能 (Ollama版)...")
    
    # 导入步骤2的函数
    from create_memcube_with_memreader_ollama import create_memcube_with_memreader, load_document_to_memcube
    
    # 创建MemCube并加载文档
    print("\n1️⃣ 创建MemCube并加载文档...")
    mem_cube = create_memcube_with_memreader()
    # 加载文档
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    doc_path = os.path.join(current_dir, "company_handbook.txt")
    load_document_to_memcube(mem_cube, doc_path)
    
    # 创建MOS配置
    print("\n2️⃣ 创建MOS配置...")
    mos_config = create_mos_config()
    
    # 创建MOS实例并注册MemCube
    print("3️⃣ 创建MOS实例并注册MemCube...")
    mos = MOS(mos_config)
    mos.register_mem_cube(mem_cube, mem_cube_id="handbook")
    
    print("✅ MOS实例创建成功！")
    print(f"  📊 用户ID: {mos.user_id}")
    print(f"  📊 会话ID: {mos.session_id}")
    print(f"  📊 注册的MemCube: {list(mos.mem_cubes.keys())}")
    print(f"  🎯 配置模式: OLLAMA")
    print(f"  🤖 聊天模型: {os.getenv('OLLAMA_CHAT_MODEL')} (Ollama)")
    print(f"  🔍 嵌入模型: {os.getenv('OLLAMA_EMBED_MODEL')} (Ollama)")
    
    # 测试搜索功能
    print("\n🔍 测试搜索功能...")
    test_queries = [
        "公司的工作时间是什么？",
        "年假有多少天？",
        "有什么福利待遇？",
        "如何联系HR部门？"
    ]
    
    for query in test_queries:
        print(f"\n❓ 查询: {query}")
        
        # 使用MOS搜索
        search_results = mos.search(query, top_k=2)
        
        if search_results and search_results.get("text_mem"):
            print(f"📋 找到 {len(search_results['text_mem'])} 个相关结果:")
            for cube_result in search_results['text_mem']:
                cube_id = cube_result['cube_id']
                memories = cube_result['memories']
                print(f"  📦 MemCube: {cube_id}")
                for i, memory in enumerate(memories[:2], 1):  # 只显示前2个结果
                    print(f"    {i}. {memory.memory[:100]}...")
        else:
            print("😓 未找到相关结果")
    
    # 测试对话功能
    print("\n💬 测试对话功能...")
    chat_questions = [
        "公司的工作时间安排是怎样的？",
        "员工可以享受哪些福利？",
        "如何联系IT支持部门？"
    ]
    
    for question in chat_questions:
        print(f"\n👤 问题: {question}")
        
        try:
            response = mos.chat(question)
            print(f"🤖 回答: {response}")
        except Exception as e:
            print(f"❌ 对话失败: {e}")
    
    print("\n🎉 测试完成！")
    return mos

if __name__ == "__main__":
    test_memcube_search_and_chat() 
```

#### 実行例

```bash
# 步骤3：测试搜索和对话
python test_memcube_search_and_chat_ollama.py
```




### 配方 1.3：MemCube 基础操作：创建、增加记忆、保存、读取、查询、删除 (Ollama版)

**🎯 問題シナリオ：** すでにいくつかのMemCubeを作成しています：会社規程、会社人事、会社ナレッジベース...。それらの完全なライフサイクル全体を効果的に管理する方法を学ぶ必要があります：作成、メモリの追加、ディスクへの保存、ディスクからの読み込み、メモリ内でのクエリ（基本クエリと高度なメタデータクエリ）、および不要なMemCubeのクリーンアップ（メモリからの削除とファイルの削除）。

**🔧 解決策：** 環境チェック、スマート構成、基本クエリ、高度なメタデータ操作、ならびに精密なメモリ管理とファイル管理を含む、MemCubeの完全なライフサイクル管理を習得します。

#### Step 1: MemCubeノ完全ナライフサイクル管理

```python
 # memcube_lifecycle_ollama.py
# 🎯 MemCubeライフサイクル管理：作成、メモリの追加、保存、読み取り、クエリ、削除 (Ollama版)
import os
import shutil
import time
from pathlib import Path
from dotenv import load_dotenv
from memos.mem_cube.general import GeneralMemCube
from memos.configs.mem_cube import GeneralMemCubeConfig

class MemCubeManager:
    """
    🎯 MemCubeライフサイクルマネージャー (Ollama版)
    """
  
    def __init__(self, storage_root="./memcube_storage"):
        self.storage_root = Path(storage_root)
        self.storage_root.mkdir(exist_ok=True)
        self.loaded_cubes = {}  # メモリ内のMemCubeキャッシュ
    
    def create_empty_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 空のMemCubeを作成する（サンプルデータは含まない）
        """
        
        # 環境変数を読み込む
        load_dotenv()
        
        # Ollama構成を取得する
        ollama_base_url = os.getenv("OLLAMA_BASE_URL")
        ollama_chat_model = os.getenv("OLLAMA_CHAT_MODEL")
        ollama_embed_model = os.getenv("OLLAMA_EMBED_MODEL")
        
        if not ollama_base_url or not ollama_chat_model or not ollama_embed_model:
            raise ValueError("❌ Ollama環境変数が構成されていません。.envファイルでOLLAMA_BASE_URL、OLLAMA_CHAT_MODEL、OLLAMA_EMBED_MODELを構成してください。")
        
        print("✅ Ollamaローカルモデルモードを検出しました")
        
        # MemOS構成を取得する
        user_id = os.getenv("MOS_USER_ID", "demo_user")
        
        # Ollamaモード構成
        cube_config = {
            "user_id": user_id,
            "cube_id": cube_id,
            "text_mem": {
                "backend": "general_text",
                "config": {
                    "extractor_llm": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_chat_model,
                            "api_base": ollama_base_url
                        }
                    },
                    "embedder": {
                        "backend": "ollama",
                        "config": {
                            "model_name_or_path": ollama_embed_model,
                            "api_base": ollama_base_url
                        }
                    },
                    "vector_db": {
                        "backend": "qdrant",
                        "config": {
                            "collection_name": f"collection_{cube_id}_{int(time.time())}",
                            "vector_dimension": 768,
                            "distance_metric": "cosine"
                        }
                    }
                }
            },
            "act_mem": {"backend": "uninitialized"},
            "para_mem": {"backend": "uninitialized"}
        }
        
        config_obj = GeneralMemCubeConfig.model_validate(cube_config)
        mem_cube = GeneralMemCube(config_obj)
        
        print(f"✅ 空のMemCubeを作成しました: {cube_id}")
        return mem_cube
  
    def save_memcube(self, mem_cube: GeneralMemCube, cube_id: str) -> str:
        """
        🎯 MemCubeをディスクに保存する
        """
    
        save_path = self.storage_root / cube_id
    
        print(f"💾 MemCubeを次に保存します: {save_path}")
    
        try:
            # ⚠️ ディレクトリが存在する場合は、先にクリーンアップする
            if save_path.exists():
                shutil.rmtree(save_path)
        
            # MemCubeを保存する
            mem_cube.dump(str(save_path))
        
            print(f"✅ MemCube '{cube_id}' の保存に成功しました")
            return str(save_path)
        
        except Exception as e:
            print(f"❌ 保存に失敗しました: {e}")
            raise
  
    def load_memcube(self, cube_id: str) -> GeneralMemCube:
        """
        🎯 ディスクからMemCubeを読み込む
        """
    
        load_path = self.storage_root / cube_id
    
        if not load_path.exists():
            raise FileNotFoundError(f"MemCube '{cube_id}' は {load_path} に存在しません")
    
        print(f"📂 ディスクからMemCubeを読み込みます: {load_path}")
    
        try:
            # ディレクトリからMemCubeを読み込む
            mem_cube = GeneralMemCube.init_from_dir(str(load_path))
        
            # メモリにキャッシュする
            self.loaded_cubes[cube_id] = mem_cube
        
            print(f"✅ MemCube '{cube_id}' の読み込みに成功しました")
            return mem_cube
        
        except Exception as e:
            print(f"❌ 読み込みに失敗しました: {e}")
            raise
  
    def list_saved_memcubes(self) -> list:
        """
        🎯 保存済みのすべてのMemCubeを一覧表示する
        """
    
        saved_cubes = []
    
        for item in self.storage_root.iterdir():
            if item.is_dir():
                # 有効なMemCubeディレクトリかどうかを確認する
                readme_path = item / "README.md"
                if readme_path.exists():
                    saved_cubes.append({
                        "cube_id": item.name,
                        "path": str(item),
                        "size": self._get_dir_size(item)
                    })
    
        return saved_cubes
    
    def unload_memcube(self, cube_id: str) -> bool:
        """
        🎯 MemCubeをメモリから削除する（ファイルは削除しない）
        """
        
        if cube_id in self.loaded_cubes:
            del self.loaded_cubes[cube_id]
            print(f"♻️ MemCube '{cube_id}' はメモリから削除されました")
            return True
        else:
            print(f"⚠️ MemCube '{cube_id}' はメモリ内にありません")
            return False
    
    def delete_memcube(self, cube_id: str) -> bool:
        """
        🎯 MemCubeのローカルファイルを削除する
        """
        
        delete_path = self.storage_root / cube_id
        
        if not delete_path.exists():
            print(f"⚠️ MemCube '{cube_id}' は {delete_path} に存在しません")
            return False
        
        print(f"🗑️ MemCubeファイルを削除します: {delete_path}")
        
        try:
            # ディレクトリを削除する
            shutil.rmtree(delete_path)
            
            # メモリキャッシュから削除する（まだメモリ内にある場合）
            if cube_id in self.loaded_cubes:
                del self.loaded_cubes[cube_id]
            
            print(f"✅ MemCube '{cube_id}' のファイル削除に成功しました")
            return True
            
        except Exception as e:
            print(f"❌ 削除に失敗しました: {e}")
            return False
  
    def _get_dir_size(self, path: Path) -> str:
        """ディレクトリサイズを計算する"""
        total_size = sum(f.stat().st_size for f in path.rglob('*') if f.is_file())
        return f"{total_size / 1024:.1f} KB"

def add_memories_to_cube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 MemCubeにメモリを追加する
    """
    
    print(f"🧠 {cube_name} にメモリを追加しています...")
    
    # いくつかのサンプルメモリを追加する（豊富なメタデータを含む）
    memories = [
        {"memory": f"阿珍は阿強に恋をした", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"阿珍の身長は1.5メートル", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}},
        {"memory": f"阿珍は暗殺者である", "metadata": {"type": "fact", "source": "web", "confidence": 0.7}},
        {"memory": f"阿強はプログラマーである", "metadata": {"type": "fact", "source": "conversation", "confidence": 0.9}},
        {"memory": f"阿強はコードを書くのが好き", "metadata": {"type": "fact", "source": "file", "confidence": 0.8}}
    ]
    
    mem_cube.text_mem.add(memories)
    
    print(f"✅ {len(memories)} 件のメモリを {cube_name} に正常に追加しました")
    
    # 現在のメモリ数を表示する
    all_memories = mem_cube.text_mem.get_all()
    print(f"📊 {cube_name} の現在のメモリ総数: {len(all_memories)}")

def basic_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 MemCubeの基本クエリ
    """
  
    print(f"🔍 {cube_name} の基本クエリ:")
  
    # すべてのメモリを取得する
    all_memories = mem_cube.text_mem.get_all()
    print(f"  📊 メモリ総数: {len(all_memories)}")
  
    # 特定の内容を検索する
    search_results = mem_cube.text_mem.search("愛情", top_k=1)
    print(f"  🎯 '愛情' の検索結果: {len(search_results)}件")
  
    for i, result in enumerate(search_results, 1):
        print(f"    {i}. {result.memory}")

def advanced_query_memcube(mem_cube: GeneralMemCube, cube_name: str):
    """
    🎯 MemCubeの高度なクエリ（メタデータ操作）
    """
  
    print(f"🔬 {cube_name} の高度なクエリ:")
  
    # すべてのメモリを取得する
    all_memories = mem_cube.text_mem.get_all()
    
    # 1. TextualMemoryItemの完全な構造を表示する
    print("  📋 最初のメモリの完全な構造:")
    first_memory = all_memories[0]
    print(f"    {first_memory}")
    print(f"    ID: {first_memory.id}")
    print(f"    内容: {first_memory.memory}")
    print(f"    メタデータ: {first_memory.metadata}")
    print(f"    タイプ: {first_memory.metadata.type}")
    print(f"    ソース: {first_memory.metadata.source}")
    print(f"    信頼度: {first_memory.metadata.confidence}")
    print()
    
    # 2. メタデータフィルタリング
    print("  🔍 メタデータフィルタリング:")
    
    # 高信頼度のメモリをフィルタリングする
    high_confidence = [m for m in all_memories if m.metadata.confidence and m.metadata.confidence >= 0.9]
    print(f"    高信頼度メモリ (>=0.9): {len(high_confidence)}件")
    for i, memory in enumerate(high_confidence, 1):
        print(f"      {i}. {memory.memory} (信頼度: {memory.metadata.confidence})")
    
    # 特定ソースのメモリをフィルタリングする
    conversation_memories = [m for m in all_memories if m.metadata.source == "conversation"]
    print(f"    会話ソースのメモリ: {len(conversation_memories)}件")
    for i, memory in enumerate(conversation_memories, 1):
        print(f"      {i}. {memory.memory} (ソース: {memory.metadata.source})")
    
    # ファイルソースのメモリをフィルタリングする
    file_memories = [m for m in all_memories if m.metadata.source == "file"]
    print(f"    ファイルソースのメモリ: {len(file_memories)}件")
    for i, memory in enumerate(file_memories, 1):
        print(f"      {i}. {memory.memory} (ソース: {memory.metadata.source})")
    
    # 3. 組み合わせフィルタリング
    print("  🔍 組み合わせフィルタリング:")
    high_conf_file = [m for m in all_memories 
                     if m.metadata.source == "file" and m.metadata.confidence and m.metadata.confidence >= 0.8]
    print(f"    高信頼度のファイルメモリ: {len(high_conf_file)}件")
    for i, memory in enumerate(high_conf_file, 1):
        print(f"      {i}. {memory.memory} (ソース: {memory.metadata.source}, 信頼度: {memory.metadata.confidence})")
    
    # 4. 統計情報
    print("  📊 統計情報:")
    sources = {}
    confidences = []
    
    for memory in all_memories:
        # ソースを集計する
        source = memory.metadata.source
        sources[source] = sources.get(source, 0) + 1
        
        # 信頼度を収集する
        if memory.metadata.confidence:
            confidences.append(memory.metadata.confidence)
    
    print(f"    ソース分布: {sources}")
    if confidences:
        avg_confidence = sum(confidences) / len(confidences)
        print(f"    平均信頼度: {avg_confidence:.2f}")

# 🎯 完全なライフサイクル管理をデモする
def demonstrate_lifecycle():
    """
    MemCubeの完全なライフサイクルをデモする
    """
  
    manager = MemCubeManager()
  
    print("🚀 MemCubeライフサイクルデモを開始します...\n")
  
    # ステップ1: MemCubeを作成する
    print("1️⃣ MemCubeを作成する")
    cube1 = manager.create_empty_memcube("demo_cube_1")
  
    # ステップ2: メモリを追加する
    print("\n2️⃣ メモリを追加する")
    add_memories_to_cube(cube1, "demo_cube_1")
  
    # ステップ3: ディスクに保存する
    print("\n3️⃣ MemCubeをディスクに保存する")
    manager.save_memcube(cube1, "demo_cube_1")
  
    # ステップ4: 保存されたMemCubeを一覧表示する
    print("\n4️⃣ 保存済みのMemCubeを一覧表示する")
    saved_cubes = manager.list_saved_memcubes()
    for cube_info in saved_cubes:
        print(f"  📦 {cube_info['cube_id']} - {cube_info['size']}")
  
    # ステップ5: ディスクから読み取る
    print("\n5️⃣ ディスクからMemCubeを読み取る")
    del cube1  # 💡 メモリ内の参照を削除する
  
    reloaded_cube = manager.load_memcube("demo_cube_1")
  
    # ステップ6: 基本クエリ
    print("\n6️⃣ 基本クエリ")
    basic_query_memcube(reloaded_cube, "再読み込みされたdemo_cube_1")
    
    # ステップ7: 高度なクエリ（メタデータ操作）
    print("\n7️⃣ 高度なクエリ（メタデータ操作）")
    advanced_query_memcube(reloaded_cube, "再読み込みされたdemo_cube_1")
  
    # ステップ8: MemCubeをメモリから削除する
    print("\n8️⃣ MemCubeをメモリから削除する")
    manager.unload_memcube("demo_cube_1")
    
    # ステップ9: ローカルファイルを削除する
    print("\n9️⃣ ローカルファイルを削除する")
    manager.delete_memcube("demo_cube_1")

if __name__ == "__main__":
    """
    🎯 メイン関数 - MemCubeライフサイクルデモを実行する
    """
    try:
        demonstrate_lifecycle()
        print("\n🎉 MemCubeライフサイクルデモが完了しました！")
    except Exception as e:
        print(f"\n❌ デモ中にエラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
```


#### 実行例

```bash
# MemCubeライフサイクルデモを実行する
python memcube_lifecycle_ollama.py
```

#### よくある問題とベストプラクティス

**🔧 ベストプラクティス：**

1. **メモリ管理**

   ```python
   # ✅ 良い方法：同時にロードするMemCubeの数を制限する
   memory_manager = MemCubeMemoryManager()
   memory_manager.max_active_cubes = 3
   
   # ❌ 回避する：MemCubeを無制限にロードする
   # これはメモリオーバーフローを引き起こす可能性があります
   ```

2. **永続化戦略**

   ```python
   # ✅ 重要なデータを定期的に保存する
   if important_changes:
       cube_manager.save_memcube(mem_cube, "important_data")
   
   # ✅ バージョン化された命名を使用する
   timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
   cube_manager.save_memcube(mem_cube, f"data_backup_{timestamp}")
   ```

3. **クエリ最適化**

   ```python
   # ✅ top_kを適切に設定する
   results = mem_cube.text_mem.search(query, top_k=5)  # 通常は5-10で十分
   
   # ✅ メタデータフィルタを使用して検索範囲を縮小する
   filtered_memories = advanced_ops.filter_by_metadata({"category": "important"})
   ```

**🐛 よくある問題：**

**Q1: MemCubeの保存に失敗する？**

```python
# 🔧 十分なディスク容量と書き込み権限があることを確認する
import shutil
free_space = shutil.disk_usage(".").free / (1024**3)
print(f"使用可能容量: {free_space:.1f} GB")
```

**Q2: クエリ結果が正確ではない？**

```python
# 🔧 埋め込みモデルが正しく構成されているかを確認する
print(f"埋め込みモデル: {mem_cube.text_mem.config.embedder}")

# 🔧 異なる検索語を試す
synonyms = ["重要", "鍵", "核心", "主要"]
for synonym in synonyms:
    results = mem_cube.text_mem.search(synonym)
```

**Q3: メモリ使用量が高すぎる？**

```python
# 🔧 メモリ使用量を監視して最適化する
memory_manager.memory_health_check()
memory_manager.unload_cube("unused_cube_id")
gc.collect()
```
